require('dotenv').config();

const app = require('./src/app');
const { env } = require('./src/config/env');

app.listen(env.port, () => {
  console.log(`Servidor corriendo en http://localhost:${env.port}`);
  if (!env.isProd) {
    console.log(`CORS permitido para: ${env.frontendUrl}`);
    try {
      const dbHost = new URL(env.databaseUrl).hostname;
      console.log(`Base de datos: ${dbHost}`);
    } catch {
      console.log('Base de datos: (URL no válida)');
    }
  }
});
