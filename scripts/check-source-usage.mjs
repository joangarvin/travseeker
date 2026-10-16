import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../front/package.json', import.meta.url));
const ts = require('typescript');
const extensions = ['.ts', '.tsx', '.js', '.mjs', '.json', '.css'];
const ignoredDirectories = new Set(['node_modules', '.git', 'dist', 'output', 'backups']);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(async (entry) => {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return ignoredDirectories.has(entry.name) ? [] : collectFiles(filename);
      }
      return extensions.includes(path.extname(filename)) ? [filename] : [];
    }),
  );
  return groups.flat();
}

function moduleReferences(filename, content) {
  if (filename.endsWith('.css')) {
    return [...content.matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g)].map(
      (match) => match[1],
    );
  }
  if (filename.endsWith('.json')) return [];

  const references = [];
  const source = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      references.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      references.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return references;
}

const files = await collectFiles(root);
const knownFiles = new Set(files);
const graph = new Map(
  await Promise.all(
    files.map(async (filename) => {
      const references = moduleReferences(filename, await readFile(filename, 'utf8'));
      const dependencies = references
        .filter((reference) => reference.startsWith('.'))
        .map((reference) => {
          const base = path.resolve(path.dirname(filename), reference);
          return [
            base,
            ...extensions.map((extension) => base + extension),
            ...extensions.map((extension) => path.join(base, 'index' + extension)),
          ].find((candidate) => knownFiles.has(candidate));
        })
        .filter(Boolean);
      return [filename, dependencies];
    }),
  ),
);

const isSource = (filename) =>
  ['front/src/', 'backend/src/'].some((directory) =>
    filename.startsWith(path.join(root, directory)),
  );
// Tests, tools and configuration are entry points; the web application starts in main.tsx.
const pending = files.filter((filename) => !isSource(filename));
pending.push(path.join(root, 'front/src/main.tsx'));
const reachable = new Set();
while (pending.length) {
  const filename = pending.pop();
  if (reachable.has(filename)) continue;
  reachable.add(filename);
  pending.push(...(graph.get(filename) || []));
}

const unused = files.filter((filename) => isSource(filename) && !reachable.has(filename));
if (unused.length) {
  console.error('Archivos de código sin referencias. Revisa si deben conectarse o eliminarse:');
  for (const filename of unused) console.error(`  ${path.relative(root, filename)}`);
  process.exitCode = 1;
} else {
  console.log(
    'Todos los archivos de código tienen referencias desde la aplicación, pruebas o herramientas.',
  );
}
