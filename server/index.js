require('newrelic');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const indexRoutes = require('../routes/index.js');
const videoRoutes = require('../routes/video.js');
const app = new Koa();

const host = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 1337;

app.use(bodyParser());
app.use(indexRoutes.routes());
app.use(videoRoutes.routes());

const server = app.listen(PORT, () => {
  console.log('Listening on port:', PORT);
});

server.on('error', () => {
  return;
});

server.on('timeout', () => {
  return;
});

server.on('uncaughtException', () => {
  return;
});

module.exports = server;
