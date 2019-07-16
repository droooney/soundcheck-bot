import * as http from 'http';
import Application = require('koa');
import BodyParser = require('koa-bodyparser');
import Router = require('koa-router');

const app = new Application();
const server = http.createServer(app.callback());
const router = new Router();

interface Body {
  type: string;
}

router.post('/oajhnswfa78sfnah87hbhnas9f8', async (ctx) => {
  const body: Body = ctx.request.body;
  const {
    type
  } = body;

  console.log('bot message', body);

  if (type === 'confirmation') {
    ctx.body = 'd48b8072';
  } else {
    ctx.body = {
      success: true
    };
  }
});

app.use(async (ctx, next) => {
  console.log(ctx.method, ctx.type, ctx.url);

  await next();
});
app.use(BodyParser());

app.use(router.routes());
app.use(router.allowedMethods());

async function main() {
  await new Promise((resolve) => {
    server.listen(process.env.PORT || 5778, () => {
      console.log('Listening...');

      resolve();
    });
  });
}

main();

