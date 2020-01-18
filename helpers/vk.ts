import axios from 'axios';
import * as _ from 'lodash';
import * as qs from 'querystring';

import {
  ConversationsResponse,
  GetUsersResponse,
  Keyboard,
  ManagersResponse,
  Message,
  MessageAttachment,
  OnlineStatusResponse,
  Post,
  SendMessageResponse,
  Subscription,
  VkUser,
  WallAttachment,
} from '../types';
import { timeout } from './common';
import config from '../config';
import VKError from '../VKError';
import User from '../database/User';

export interface VKRequestMap {
  'groups.getMembers': ManagersResponse;
  'messages.getConversations': ConversationsResponse;
  'messages.send': SendMessageResponse;
  'users.get': GetUsersResponse;
  'groups.getOnlineStatus': OnlineStatusResponse;
  'groups.enableOnline': 1;
}

export async function sendVKRequest<T extends keyof VKRequestMap>(method: T, query: object = {}): Promise<VKRequestMap[T]> {
  const response = await axios.post(`https://api.vk.com/method/${method}`, qs.stringify({
    v: '5.103',
    access_token: config.vkToken,
    ...query,
  }));

  if (response.data.error) {
    throw new VKError(response.data.error);
  }

  return response.data.response;
}

export interface SendVkMessageOptions {
  keyboard?: Keyboard;
  forwardMessages?: number[];
  attachments?: MessageAttachment[];
  randomId?: number | bigint;
  dontParseLinks?: boolean;
  lat?: number;
  long?: number;
}

export async function sendVKMessage(dest: number | number[], message: string, options: SendVkMessageOptions = {}): Promise<SendMessageResponse> {
  return await sendVKRequest('messages.send', {
    user_ids: typeof dest === 'number' ? dest : dest.join(','),
    random_id: (options.randomId || 0).toString(),
    message,
    keyboard: JSON.stringify(options.keyboard),
    forward_messages: (options.forwardMessages || []).join(','),
    attachment: (options.attachments || []).map(({ type, id }) => type + id).join(','),
    dont_parse_links: +('dontParseLinks' in options ? options.dontParseLinks! : true),
    lat: options.lat,
    long: options.long
  });
}

export async function sendVKMessages(dest: number[], message: string, options?: SendVkMessageOptions): Promise<SendMessageResponse> {
  const response: SendMessageResponse = [];
  const chunks = _.chunk(dest, 50);

  for (const chunk of chunks) {
    response.push(...await sendVKMessage(chunk, message, options));

    await timeout(1000);
  }

  return response;
}

export async function sendVkMessageToSubscribedUsers(subscriptions: Subscription[], message: string, options?: SendVkMessageOptions): Promise<SendMessageResponse> {
  const subscribedUsers = (await User.findAll()).filter((user) => (
    user.subscriptions.some((subscription) => subscriptions.includes(subscription))
  ));

  return await sendVKMessages(subscribedUsers.map(({ vkId }) => vkId), message, options);
}

export async function sendVkMessageToAllConversations(message: string, options?: SendVkMessageOptions): Promise<SendMessageResponse> {
  const vkIds = await getAllConversations();

  return await sendVKMessages(vkIds, message, options);
}

export async function getAllConversations(): Promise<number[]> {
  const conversations: number[] = [];
  const count = 200;
  let offset = 0;

  while (true) {
    const { items } = await sendVKRequest('messages.getConversations', { offset, count });

    conversations.push(...items.map(({ conversation }) => conversation.peer.id));

    if (items.length < count) {
      break;
    }

    offset = conversations.length;

    await timeout(100);
  }

  return conversations;
}

export async function getVkUsers(vkIds: number[]): Promise<VkUser[]> {
  const users: VkUser[] = [];
  const count = 1000;
  let offset = 0;

  while (offset < vkIds.length) {
    users.push(
      ...await sendVKRequest('users.get', {
        user_ids: vkIds.slice(offset, offset + count).join(','),
        fields: ['sex', 'bdate'].join(',')
      })
    );

    offset += count;
  }

  return users;
}

export async function getVkUser(vkId: number): Promise<VkUser> {
  return (await getVkUsers([vkId]))[0];
}

export async function getManagers(): Promise<number[]> {
  try {
    const { items } = await sendVKRequest('groups.getMembers', {
      group_id: config.soundcheckId,
      filter: 'managers'
    });

    return items.map(({ id }) => id);
  } catch {
    return [];
  }
}

export function getPostId(message: Message): string | null {
  const wallAttachment = message.attachments.find(({ type }) => type === 'wall') as WallAttachment | undefined;

  if (wallAttachment) {
    return `${wallAttachment.wall.to_id}_${wallAttachment.wall.id}`;
  }

  try {
    const url = new URL(message.text);

    if (url.protocol !== 'https:' && url.hostname !== 'vk.com') {
      return null;
    }

    const pathMatch = url.pathname.match(/^\/wall(-?\d+_\d+)$/);

    if (pathMatch) {
      return pathMatch[1];
    }

    const wallQuery = url.searchParams.get('w');

    if (!wallQuery) {
      return null;
    }

    const wallMatch = wallQuery.match(/^wall(-?\d+_\d+)$/);

    return wallMatch && wallMatch[1];
  } catch (err) {
    return null;
  }
}

export function getRepostPostId(post: Post): string | null {
  if (!post.copy_history) {
    return post.owner_id === -config.soundcheckId
      ? `${post.owner_id}_${post.id}`
      : null;
  }

  for (const historyPost of post.copy_history) {
    const postId = getRepostPostId(historyPost);

    if (postId) {
      return postId;
    }
  }

  return null;
}

export function getUserLink(userId: number): string {
  return `https://vk.com/id${userId}`;
}

export function getPostLink(postId: string): string {
  return `https://vk.com/wall${postId}`;
}

export function getProductLink(productId: string): string {
  return `https://vk.com/soundcheck_ural?w=product${productId}`;
}
