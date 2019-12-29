import * as _ from 'lodash';
import moment = require('moment-timezone');
import { Context } from 'koa';
import { Op } from 'sequelize';

import {
  SendVkMessageOptions,

  generateRandomCaption,
  getPostLink,
  getRepostPostId,
  getVkUser,
  sendVKMessage,
  sendVkMessageToSubscribedUsers,
  sendVKMessages,
} from './helpers';
import {
  Body,
  ButtonPayload,
  Hashtag,
  PhotoAttachment,
  Subscription,
  UserState,
} from './types';
import {
  captions,
  hashtagCombinations,
  subscriptionHashtags,
} from './constants';
import { generateMainKeyboard } from './keyboards';
import actionMap, { ActionCallback, CommandAction } from './actionMap';
import config from './config';
import Logger from './Logger';
import sequelize from './database';
import User from './database/User';
import Click from './database/Click';
import GroupUser from './database/GroupUser';
import Repost from './database/Repost';
import KeyValuePair from './database/KeyValuePair';

export default async (ctx: Context) => {
  const body: Body = ctx.request.body;
  const requestTime = moment();
  const latestClickTime = requestTime.clone().subtract(1, 'minute');

  Logger.log('bot event', body);

  if (body.type === 'confirmation') {
    ctx.body = config.confirmationCode;

    return;
  }

  eventHandler: if (body.type === 'message_new') {
    const {
      message: {
        id: messageId,
        peer_id: vkId
      },
      client_info: clientInfo
    } = body.object;
    const isManager = ctx.managers.includes(vkId);
    const mainKeyboard = generateMainKeyboard(isManager);
    const respond = async (message: string, options: SendVkMessageOptions = {}) => {
      await sendVKMessage(vkId, message, {
        randomId: body.object.message.conversation_message_id,
        ...options
      });
    };
    let isNewUser = false;
    const user = await User.findOne({ where: { vkId } }) || await (async () => {
      const vkUser = await getVkUser(vkId);

      isNewUser = true;

      return User.add({
        vkId,
        ...User.getVkUserData(vkUser)
      });
    })();
    const userState = user.state;
    const newLastMessageDate = new Date(body.object.message.date * 1000);
    let buttonPayload: ButtonPayload | null = null;
    let payload: ButtonPayload | UserState | null = null;

    if (body.object.message.payload) {
      try {
        buttonPayload = payload = JSON.parse(body.object.message.payload);
      } catch (err) {}
    }

    if (
      !isManager
      && buttonPayload
      && buttonPayload.command !== 'start'
      && buttonPayload.command !== 'back'
      && buttonPayload.command !== 'poster/subscribe'
      && buttonPayload.command !== 'playlists/subscribe'
      && buttonPayload.command !== 'text_materials/subscribe'
      && buttonPayload.command !== 'releases/subscribe'
      && buttonPayload.command !== 'drawings/subscribe'
      && !buttonPayload.command.startsWith('subscriptions')
      && !buttonPayload.command.startsWith('write_to_soundcheck')
      && !buttonPayload.command.startsWith('admin')
    ) {
      try {
        const userClicks = await Click.findAll({
          where: {
            vkId,
            createdAt: {
              [Op.gte]: latestClickTime.toDate()
            }
          }
        });

        if (userClicks.every((click) => !_.isEqual(click.payload, payload))) {
          await Click.add({
            vkId,
            payload: buttonPayload
          });
        }
      } catch (err) {
        Logger.log(err, 'save click error');
      }
    }

    if (!payload) {
      payload = userState;
    }

    if (user.lastMessageDate > newLastMessageDate) {
      break eventHandler;
    }

    message: if (payload) {
      if ((payload.command.startsWith('admin') || (payload.command === 'back' && payload.dest.startsWith('admin'))) && !isManager) {
        await respond(captions.you_re_not_a_manager, { keyboard: mainKeyboard });

        break message;
      }

      if (payload.command in actionMap) {
        const action = actionMap[payload.command] as ActionCallback<CommandAction<typeof payload.command>>;

        await action({
          respond,
          payload,
          user,
          message: body.object.message,
          clientInfo,
          mainKeyboard
        });
      } else {
        Logger.warn('warning: unknown payload', payload);

        await respond(generateRandomCaption(captions.unknown_payload), { keyboard: mainKeyboard });
      }
    } else if (isNewUser) {
      await respond(captions.welcome_text(user), { keyboard: mainKeyboard });
    } else {
      await Promise.all([
        respond(captions.unknown_message_response),
        sendVKMessage(config.targets.unknownMessage, captions.unknown_message, {
          forwardMessages: [messageId]
        })
      ]);
    }

    user.lastMessageDate = newLastMessageDate;
    user.state = user.state === userState
      ? null
      : user.state;

    await user.save();
  } else if (body.type === 'group_officers_edit') {
    const {
      user_id,
      level_new
    } = body.object;

    const newManagers = ctx.managers.filter((id) => id !== user_id);

    if (level_new > 1) {
      newManagers.push(user_id);
    }

    ctx.changeManagers(newManagers);
  } else if (
    body.type === 'group_leave'
    || (body.type === 'group_join' && (body.object.join_type === 'join' || body.object.join_type === 'accepted'))
  ) {
    const vkId = body.object.user_id;
    const status = body.type === 'group_join';
    const now = moment();
    const startOfDay = now.startOf('day').toDate();
    const endOfDay = now.endOf('day').toDate();

    await sequelize.transaction(async (transaction) => {
      const groupUser = await GroupUser.findOne({
        where: {
          vkId,
          createdAt: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          },
        },
        transaction
      });

      if (groupUser) {
        if (groupUser.status === status) {
          await groupUser.save({ transaction });
        } else {
          await groupUser.destroy({ transaction });
        }
      } else {
        await GroupUser.add({ vkId, status }, { transaction });
      }
    });
  } else if (body.type === 'wall_post_new') {
    const photoAttachment = (body.object.attachments || []).find(({ type }) => type === 'photo') as PhotoAttachment | undefined;

    if (photoAttachment) {
      const postId = `${body.object.owner_id}_${body.object.id}`;
      const hashtags = photoAttachment.photo.text
        .split(/\s+/)
        .map((hashtag) => hashtag.trim())
        .filter(Boolean);
      const hashtagFromCombination = _.find(hashtagCombinations, ([combination]) => (
        combination.every((hashtag) => hashtags.includes(hashtag))
      ));
      const hashtag = hashtagFromCombination
        ? hashtagFromCombination[1]
        : _.find(Hashtag, (hashtag) => hashtags.includes(hashtag));

      const isNewReleasesPost = hashtags.includes(Hashtag.NEW_RELEASE);
      const isDigestPost = hashtags.includes(Hashtag.DIGEST);

      if (isDigestPost && !isNewReleasesPost) {
        const latestDigestLink = await KeyValuePair.findOrAdd('latest_digest_link');

        latestDigestLink.value = getPostLink(postId);

        await latestDigestLink.save();
      } else if (isNewReleasesPost) {
        const latestReleasesLink = await KeyValuePair.findOrAdd('latest_releases_link');

        latestReleasesLink.value = getPostLink(postId);

        await latestReleasesLink.save();
      }

      if (hashtag) {
        const subscriptionCaptions = captions.subscription_message[hashtag];
        const subscriptions = _.filter(Subscription, (subscription) => (
          subscriptionHashtags[subscription].some((hashtag) => hashtags.includes(hashtag))
        ));
        const caption = subscriptionCaptions[Math.floor(Math.random() * subscriptionCaptions.length)];
        const messageOptions: SendVkMessageOptions = {
          attachments: [{ type: 'wall', id: postId }],
          randomId: 2n ** 30n + BigInt(body.object.id),
        };

        if (typeof caption === 'string') {
          await sendVkMessageToSubscribedUsers(subscriptions, caption, messageOptions);

          break eventHandler;
        }

        const subscribedUsers = (await User.findAll()).filter((user) => (
          user.subscriptions.some((subscription) => subscriptions.includes(subscription))
        ));
        const messageGroups = _.groupBy(subscribedUsers, (user) => (caption as Exclude<typeof caption, string>)({ user }));

        for (const message in messageGroups) {
          if (messageGroups.hasOwnProperty(message)) {
            const vkIds = messageGroups[message].map(({ vkId }) => vkId);

            await sendVKMessages(vkIds, message, messageOptions);
          }
        }
      }
    }
  } else if (body.type === 'wall_repost') {
    const ownerId = body.object.owner_id;
    const postId = body.object.id;
    const originalPostId = getRepostPostId(body.object);

    if (originalPostId) {
      const existingPost = await Repost.findOne({
        where: { ownerId, postId, originalPostId }
      });

      if (!existingPost) {
        await Repost.add({ ownerId, postId, originalPostId });
      }
    }
  }

  ctx.body = 'ok';
}
