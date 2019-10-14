import * as qs from 'querystring';
import * as util from 'util';
import * as http from 'http';
import Application = require('koa');
import BodyParser = require('koa-bodyparser');
import Router = require('koa-router');
import axios, { AxiosResponse } from 'axios';

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

interface RefreshKeyboardButtonPayload {
  command: 'refresh';
}

type ButtonPayload = (
  StartButtonPayload
  | PosterButtonPayload
  | PlaylistButtonPayload
  | RefreshKeyboardButtonPayload
);

interface BaseButtonAction {
  payload?: string;
}

interface TextButtonAction extends BaseButtonAction {
  type: 'text';
  label: string;
}

interface LocationButtonAction extends BaseButtonAction {
  type: 'location';
}

type ButtonAction = TextButtonAction | LocationButtonAction;

interface KeyboardButton {
  action: ButtonAction;
  color: 'primary' | 'secondary' | 'negative' | 'positive';
}

interface Keyboard {
  one_time?: boolean;
  buttons: KeyboardButton[][];
}

const generateButton = (text: string, payload: ButtonPayload): KeyboardButton => {
  return {
    action: {
      type: 'text',
      label: text,
      payload: JSON.stringify(payload)
    },
    color: 'primary'
  };
};
const defaultQuery = {
  v: '5.101',
  access_token: '2d0c91d1f4f816ed81c83008fa171fe5642e9153de1bebdf08f993392675512944a731975ad559157906b'
};
const sendRequest = <T>(method: string, query: object = {}): Promise<AxiosResponse<T>> => {
  const queryString = qs.stringify({
    ...defaultQuery,
    ...query
  });

  return axios.post(`https://api.vk.com/method/${method}?${queryString}`);
};
const mainKeyboard: Keyboard = {
  one_time: true,
  buttons: [[
    generateButton('Афиша', { command: 'poster' }),
    generateButton('Плейлисты', { command: 'playlist' }),
    generateButton('Обновить клавиатуру', { command: 'refresh' })
  ]]
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
      const sendMessage = async (message: string, keyboard?: Keyboard) => {
        const {
          data,
          status
        } = await sendRequest('messages.send', {
          peer_id: body.object.peer_id,
          random_id: Math.floor(Math.random() * 2 ** 32),
          message,
          keyboard
        });

        console.log('message sent', status, data);
      };

      console.log(payload);

      if (payload.command === 'start') {
        await sendMessage('Добро пожаловать в SoundCheck - Музыка Екатеринбурга. Что Вас интересует?', mainKeyboard);
      } else if (payload.command === 'playlist') {
        await sendMessage('Смотри плейлисты тут: https://vk.com/soundcheck_ural/music_selections', mainKeyboard);
      } else if (payload.command === 'refresh') {
        await sendMessage('Клавиатура обновлена', mainKeyboard);
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

