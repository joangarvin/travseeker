// Upload only an explicitly reviewed Commons plan. Never infer a license from a URL.
const fs = require("node:fs");
const path = require("node:path");
const { cloudinary, isConfigured } = require("../src/config/cloudinary");
const { env } = require("../src/config/env");
const { prisma, pool } = require("../src/config/database");
const { guideFields } = require("../src/domain/municipalityCatalog");
const apply = process.argv.includes("--apply");
const planFile = process.argv.find((arg) => arg.endsWith(".json"));
if (!planFile)
  throw new Error("Indica el archivo JSON con las fotografías revisadas.");
const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
const output = path.resolve(
  process.env.MUNICIPAL_PHOTO_OUTPUT ||
    path.join(__dirname, "../data/municipality-guides/2026-10-07-photos.json"),
);
const batch = fs.existsSync(output)
  ? JSON.parse(fs.readFileSync(output, "utf8"))
  : {
      checkedAt: plan.checkedAt,
      scope:
        "Fotografías municipales verificadas individualmente en Wikimedia Commons",
      photoPolicy:
        "CC BY, CC BY-SA, CC0 o dominio público verificado; fuente, autor, licencia y cambios visibles en la ficha.",
      municipalities: [],
    };
async function run() {
  if (apply && !isConfigured)
    throw new Error("Cloudinary no está configurado.");
  for (const photo of plan.photos) {
    if (batch.municipalities.some((m) => m.id === photo.id)) continue;
    const credit = guideFields({
      imageAttribution: photo.imageAttribution,
    }).imageAttribution;
    if (
      !credit.author ||
      !credit.title ||
      !credit.sourceUrl ||
      !credit.licenseUrl ||
      !/^(CC BY(?:-SA)? [234]\.0(?: [a-z]{2})?|CC0|Public domain)$/.test(
        credit.license,
      ) ||
      new URL(credit.sourceUrl).hostname !== "commons.wikimedia.org" ||
      new URL(credit.licenseUrl).hostname !== "creativecommons.org"
    ) {
      throw new Error("Créditos o licencia incompletos: " + photo.nombre);
    }
    const licensePath = new URL(credit.licenseUrl).pathname.replace(
      /\/?$/,
      "/",
    );
    const by = credit.license.match(
      /^CC (BY(?:-SA)?) ([234]\.0)(?: ([a-z]{2}))?$/,
    );
    const expectedPath = by
      ? `/licenses/${by[1].toLowerCase()}/${by[2]}/${by[3] ? `${by[3]}/` : ""}`
      : credit.license === "CC0"
        ? "/publicdomain/zero/1.0/"
        : "/publicdomain/mark/1.0/";
    if (!licensePath.startsWith(expectedPath))
      throw new Error("La licencia no coincide con su enlace: " + photo.nombre);
    if (
      credit.license === "Public domain" &&
      photo.publicDomainVerified !== true
    )
      throw new Error(
        "Falta comprobar la declaración de dominio público: " + photo.nombre,
      );
    for (const url of [photo.originalUrl, photo.uploadUrl]) {
      const parsed = new URL(url);
      if (
        parsed.protocol !== "https:" ||
        parsed.username ||
        parsed.password ||
        parsed.port ||
        !["upload.wikimedia.org", "thumb.wikimedia.org"].includes(
          parsed.hostname,
        )
      )
        throw new Error("Origen de imagen no permitido: " + photo.nombre);
    }
    if (!/^[a-f0-9]{40}$/.test(photo.sha1))
      throw new Error("Identificador de imagen no válido.");
    const municipality = await prisma.municipio.findUniqueOrThrow({
      where: { id: photo.id },
    });
    if (
      municipality.nombre.toLocaleLowerCase("es") !==
      photo.nombre.toLocaleLowerCase("es")
    )
      throw new Error("Municipio incorrecto: " + photo.nombre);
    if (municipality.imagen) {
      console.log("Conservada fotografía existente: " + photo.nombre);
      continue;
    }
    if (!apply) {
      console.log("Preparada: " + photo.nombre + " · " + credit.license);
      continue;
    }
    const options = {
      folder: `${env.cloudinary.folder}/municipios/licensed`,
      public_id: `${photo.id}-${photo.sha1.slice(0, 12)}`,
      overwrite: false,
      resource_type: "image",
      transformation: [{ width: 1600, height: 1600, crop: "limit" }],
    };
    let result;
    try {
      result = await cloudinary.uploader.upload(photo.uploadUrl, options);
    } catch (error) {
      // The original is the same reviewed photograph; thumbnail endpoints may rate-limit.
      if (photo.uploadUrl === photo.originalUrl) throw error;
      result = await cloudinary.uploader.upload(photo.originalUrl, options);
    }
    batch.municipalities.push({
      id: photo.id,
      nombre: photo.nombre,
      fields: {
        imagen: result.secure_url,
        imagenAlt: photo.imagenAlt,
        imageAttribution: credit,
      },
      sources: [credit.sourceUrl],
      photoOriginalUrl: photo.originalUrl,
      photoSha1: photo.sha1,
    });
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(batch, null, 2) + "\n");
    console.log("Subida: " + photo.nombre);
  }
  console.log(
    `${batch.municipalities.length} fotografías documentadas en el lote.`,
  );
}
run()
  .catch((error) => {
    console.error(error.message || "Error al subir imágenes");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
