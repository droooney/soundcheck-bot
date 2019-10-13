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
const router = new Router({
  prefix: '/soundcheck-bot5778'
});

interface Message {
  peer_id: number;
  payload?: string;
}

interface BaseBody {
  group_id: number;
}

interface ConfirmationBody extends BaseBody {
  type: 'confirmation';
}

interface NewMessageBody extends BaseBody {
  type: 'message_new';
  object: Message;
}

type Body = ConfirmationBody | NewMessageBody;

interface BaseButtonPayload {
  command: string;
}

interface StartButtonPayload extends BaseButtonPayload {
  command: 'start';
}

interface PosterButtonPayload {
  command: 'poster';
}

interface PlaylistButtonPayload {
  command: 'playlist';
}

type ButtonPayload = (
  StartButtonPayload
  | PosterButtonPayload
  | PlaylistButtonPayload
);

const generateButton = (text: string, payload: ButtonPayload) => {
  return {
    action: {
      type: 'text',
      label: text,
      payload: JSON.stringify(payload)
    },
    color: 'primary'
  };
};

router.post('/oajhnswfa78sfnah87hbhnas9f8', async (ctx) => {
  const body: Body = ctx.request.body;

  console.log('bot message', body);

  if (body.type === 'confirmation') {
    ctx.body = 'afcb8751';
  } else if (body.type === 'message_new') {
    let payload: ButtonPayload | null = null;

    if (body.object.payload) {
      try {
        payload = JSON.parse(body.object.payload);
      } catch (err) {}
    }

    if (payload) {
      console.log(payload);

      const query = {
        v: '5.101',
        access_token: '2d0c91d1f4f816ed81c83008fa171fe5642e9153de1bebdf08f993392675512944a731975ad559157906b',
        peer_id: body.object.peer_id,
        random_id: Math.floor(Math.random() * 2 ** 32)
      };

      if (payload.command === 'start') {
        const welcomeQuery = qs.stringify({
          ...query,
          message: 'Добро пожаловать в SoundCheck - Музыка Екатеринбурга. Что Вас интересует?',
          keyboard: JSON.stringify({
            one_time: false,
            buttons: [[
              generateButton('Афиша', { command: 'poster' }),
              generateButton('Плейлисты', { command: 'playlist' })
            ]]
          })
        });
        const {
          data,
          status
        } = await axios.post(`https://api.vk.com/method/messages.send?${welcomeQuery}`);

        console.log('message sent', status, data);
      } else if (payload.command === 'playlist') {
        const playlistQuery = qs.stringify({
          ...query,
          message: 'Смотри плейлисты тут: https://vk.com/soundcheck_ural/music_selections'
        });

        const {
          data,
          status
        } = await axios.post(`https://api.vk.com/method/messages.send?${playlistQuery}`);

        console.log('message sent', status, data);
      }
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

