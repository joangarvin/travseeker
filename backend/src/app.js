const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const destinoRoutes = require("./routes/destinoRoutes");
const authRoutes = require("./routes/authRoutes");
const favoritoRoutes = require("./routes/favoritoRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const alertRoutes = require("./routes/alertRoutes");
const activityRoutes = require("./routes/activityRoutes");
const tourismTypeRoutes = require("./routes/tourismTypeRoutes");
const destinoController = require("./controllers/destinoController");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "travseeker-api" });
});

app.get("/api/destacados", destinoController.getDestacados);
app.get("/api/stats", destinoController.getStats);
app.get("/api/mapa", destinoController.getMapa);
app.use("/api/auth", authRoutes);
app.use("/api/favoritos", favoritoRoutes);
app.use("/api/colecciones", collectionRoutes);
app.use("/api/recomendaciones", recommendationRoutes);
app.use("/api/destinos/:destinoId/reviews", reviewRoutes);
app.use("/api/destinos", destinoRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/tourism-types", tourismTypeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/alertas", alertRoutes);

app.use(errorHandler);

module.exports = app;
