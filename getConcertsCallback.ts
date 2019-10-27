import { Context } from 'koa';

export default async (ctx: Context) => {
  const query = ctx.query;

  console.log(query);

  ctx.body = '';
};
