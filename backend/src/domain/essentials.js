const ENTITY_MAP = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name) =>
      Object.hasOwn(ENTITY_MAP, name.toLowerCase())
        ? ENTITY_MAP[name.toLowerCase()]
        : entity,
    );
}

function plainHtml(value) {
  return decodeEntities(
    String(value || "")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function cleanText(value, maximum) {
  return plainHtml(value).replace(/\s+/g, " ").trim().slice(0, maximum);
}

function cleanPlainText(value, maximum) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function parseLegacyEssentials(html) {
  const source = String(html || "").trim();
  if (!source) return [];

  const groups = [];
  let currentGroup = null;
  const tokenPattern =
    /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>|<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let token = tokenPattern.exec(source);

  while (token) {
    if (token[1] != null) {
      const title = cleanText(token[1], 140);
      if (title) {
        currentGroup = { title, sortOrder: groups.length, items: [] };
        groups.push(currentGroup);
      }
    } else {
      const title = cleanText(token[2], 320);
      if (title) {
        if (!currentGroup) {
          currentGroup = {
            title: "Selección esencial",
            sortOrder: groups.length,
            items: [],
          };
          groups.push(currentGroup);
        }
        currentGroup.items.push({
          title,
          description: null,
          placeId: null,
          sortOrder: currentGroup.items.length,
        });
      }
    }
    token = tokenPattern.exec(source);
  }

  const populatedGroups = groups.filter((group) => group.items.length);
  if (populatedGroups.length) return populatedGroups;

  const lines = plainHtml(source)
    .split(/\n+|\s*[•·]\s*/)
    .map((line) => line.replace(/^[-–—*\d.)\s]+/, "").trim())
    .filter(Boolean);
  if (!lines.length) return [];
  return [
    {
      title: "Selección esencial",
      sortOrder: 0,
      items: lines.map((title, sortOrder) => ({
        title: title.slice(0, 320),
        description: null,
        placeId: null,
        sortOrder,
      })),
    },
  ];
}

function normalizeEssentialGroups(value) {
  if (!Array.isArray(value)) return null;
  if (value.length > 20) {
    const error = new Error("Puedes crear hasta 20 bloques de imprescindibles");
    error.status = 400;
    throw error;
  }

  return value.map((group, groupIndex) => {
    const title = cleanPlainText(group?.title, 140);
    const items = Array.isArray(group?.items) ? group.items : [];
    if (!title) {
      const error = new Error(`Pon un título al bloque ${groupIndex + 1}`);
      error.status = 400;
      throw error;
    }
    if (!items.length) {
      const error = new Error(`Añade al menos un lugar o plan en “${title}”`);
      error.status = 400;
      throw error;
    }
    if (items.length > 50) {
      const error = new Error(`“${title}” admite hasta 50 elementos`);
      error.status = 400;
      throw error;
    }

    return {
      title,
      sortOrder: groupIndex,
      items: items.map((item, itemIndex) => {
        const itemTitle = cleanPlainText(item?.title, 320);
        if (!itemTitle) {
          const error = new Error(
            `Completa el elemento ${itemIndex + 1} de “${title}”`,
          );
          error.status = 400;
          throw error;
        }
        return {
          title: itemTitle,
          description: cleanPlainText(item?.description, 700) || null,
          placeId: cleanPlainText(item?.placeId, 80) || null,
          sortOrder: itemIndex,
        };
      }),
    };
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeEssentialGroups(groups) {
  return groups
    .map(
      (group) =>
        `<h3>${escapeHtml(group.title)}</h3><ul>${group.items
          .map(
            (item) =>
              `<li>${escapeHtml(item.title)}${
                item.description ? ` — ${escapeHtml(item.description)}` : ""
              }</li>`,
          )
          .join("")}</ul>`,
    )
    .join("");
}

module.exports = {
  normalizeEssentialGroups,
  parseLegacyEssentials,
  plainHtml,
  serializeEssentialGroups,
};
