import * as qs from 'querystring';
import * as util from 'util';
import * as http from 'http';
import Application = require('koa');
import BodyParser = require('koa-bodyparser');
import Router = require('koa-router');
import axios from 'axios';

util.inspect.defaultOptions.depth = 10;

const app = new Application();
const server = http.createServer(app.callback());
const router = new Router();

interface Message {
  user_id: number;
  payload?: string;
}

interface ConfirmationBody {
  type: 'confirmation';
}

interface NewMessageBody {
  type: 'message_new';
  object: Message;
}

type Body = ConfirmationBody | NewMessageBody;

interface StartPayload {
  command: 'start';
}

type ButtonPayload = StartPayload;

router.post('/oajhnswfa78sfnah87hbhnas9f8', async (ctx) => {
  const body: Body = ctx.request.body;

  console.log('bot message', body);

  if (body.type === 'confirmation') {
    ctx.body = 'd48b8072';
  } else if (body.type === 'message_new') {
    let payload: ButtonPayload | null = null;

    if (body.object.payload) {
      try {
        payload = JSON.parse(body.object.payload);
      } catch (err) {}
    }

    if (payload && payload.command === 'start') {
      const query = qs.stringify({
        access_token: '45b653e39139ffec49a014720e9233e22c74adbccadc06a0224899fb5d3097697da3403ec6124efe9570a',
        user_id: body.object.user_id,
        message: 'Начнем!'
      });
      const {
        data,
        status
      } = await axios.post(`https://api.vk.com/method/messages.send?${query}`);

      console.log('message sent', status, data);
    }

    ctx.body = 'ok';
  } else {
    ctx.body = 'ok';
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

