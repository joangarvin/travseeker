require('dotenv').config();

const app = require('./src/app');
const { env } = require('./src/config/env');

app.listen(env.port, () => {
  console.log(`Servidor corriendo en http://localhost:${env.port}`);
  if (!env.isProd) {
    console.log(`CORS permitido para: ${env.frontendUrl}`);
  }
});
