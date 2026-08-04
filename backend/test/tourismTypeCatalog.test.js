const test = require("node:test");
const assert = require("node:assert/strict");
const { validatePayload } = require("../src/services/tourismTypeService");

test("normaliza un tipo de viaje con icono y color admitidos", () => {
  assert.deepEqual(
    validatePayload({
      name: "Urbano",
      description: "Arquitectura y vida de ciudad",
      icon: "Building2",
      colorKey: "cultural",
      colorValue: "#123456",
      sortOrder: "70",
    }),
    {
      name: "Urbano",
      slug: "urbano",
      description: "Arquitectura y vida de ciudad",
      icon: "Building2",
      colorKey: "cultural",
      colorValue: "#123456",
      sortOrder: 70,
      isActive: true,
    },
  );
});

test("reemplaza iconos y colores ajenos al sistema", () => {
  const result = validatePayload({
    name: "Termal",
    icon: "Emoji",
    colorKey: "#fff",
  });
  assert.equal(result.icon, "Compass");
  assert.equal(result.colorKey, "otro");
  assert.equal(result.colorValue, "#5f6470");
});

test("rechaza nombres de tipo vacíos", () => {
  assert.throws(() => validatePayload({ name: "" }), /al menos dos caracteres/);
});
