import * as qs from 'querystring';
import axios, { AxiosResponse } from 'axios';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import moment = require('moment-timezone');

import { Concert, Event, EventsResponse, Keyboard } from './types';
import { defaultVKQuery, SOUNDCHECK_ID } from './constants';

const {
  private_key,
  client_email,
  token_uri
} = require('./googleCredentials.json');

let googleAPIAccessToken = '';

export async function refreshGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const jwtToken = jwt.sign({
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
    aud: token_uri,
    exp: now + 3600,
    iat: now
  }, private_key, {
    algorithm: 'RS256'
  });
  const { data } = await axios.post(token_uri, qs.stringify({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwtToken
  }));

  googleAPIAccessToken = data.access_token;
}

export async function sendGoogleRequest<T>(method: string, query?: object): Promise<AxiosResponse<T>> {
  let i = 0;

  while (i++ < 5) {
    try {
      return await trySendGoogleRequest(method, query);
    } catch (err) {
      if (err.response.data.error && err.response.data.error.code === 401) {
        await refreshGoogleAccessToken();
      } else {
        throw err;
      }
    }
  }

  return trySendGoogleRequest(method, query);
}

export function trySendGoogleRequest<T>(method: string, query: object = {}): Promise<AxiosResponse<T>> {
  return axios.get(`https://www.googleapis.com/calendar/v3${method}${query ? `?${qs.stringify(query as any)}` : ''}`, {
    headers: {
      Authorization: `Bearer ${googleAPIAccessToken}`
    }
  });
}

export async function getEvents(dateStart?: moment.Moment, dateEnd?: moment.Moment): Promise<Event[]> {
  const events: Event[] = [];
  let pageToken: string | undefined;

  while (true) {
    const { data } = await sendGoogleRequest<EventsResponse>('/calendars/soundcheck.ekb@gmail.com/events', {
      maxResults: 2500,
      pageToken,
      orderBy: 'startTime',
      singleEvents: true,
      ...(dateStart ? { timeMin: dateStart.toISOString(true) } : {}),
      ...(dateEnd ? { timeMax: dateEnd.toISOString(true) } : {})
    });

    if (!data.items) {
      break;
    }

    events.push(...data.items);

    if (!data.nextPageToken) {
      break;
    }

    pageToken = data.nextPageToken;
  }

  return events;
}

export async function getConcerts(dateStart?: moment.Moment, dateEnd?: moment.Moment): Promise<Concert[]> {
  return (await getEvents(dateStart, dateEnd)).map(getConcertFromEvent).filter(({ ready }) => ready);
}

export function getConcertsByDays(concerts: Concert[]): Record<string, Concert[]> {
  return _.groupBy(concerts, (concert) => +concert.startTime.clone().startOf('day'));
}

export function sendVKRequest<T>(method: string, query: object = {}): Promise<AxiosResponse<T>> {
  return axios.post(`https://api.vk.com/method/${method}`, qs.stringify({
    ...defaultVKQuery,
    ...query,
  }));
}

export interface SendVkMessageOptions {
  keyboard?: Keyboard;
  forwardMessages?: number[];
  attachments?: string[];
}

export async function sendVKMessage(dest: number | string, message: string, options: SendVkMessageOptions = {}) {
  await sendVKRequest('messages.send', {
    peer_id: dest,
    random_id: Math.floor(Math.random() * 2 ** 32),
    message,
    keyboard: JSON.stringify(options.keyboard),
    forward_messages: (options.forwardMessages || []).join(','),
    attachment: (options.attachments || []).join(',')
  });
}

export function getConcertFields(description?: string): Partial<Record<string, string>> {
  const fields: Partial<Record<string, string>> = {};
  let string = description || '';
  let prevKey = '';

  while (string) {
    const match = string.match(/(?:^|\n)([а-я ]+):/i);

    if (!match) {
      fields[prevKey] = string.trim();

      break;
    }

    fields[prevKey] = string.slice(0, match.index).trim();
    string = string.slice(match.index! + match[0].length);
    prevKey = match[1];
  }

  return fields;
}

export function getConcertFromEvent(event: Event): Concert {
  const fields = getConcertFields(event.description);

  return {
    ready: event.colorId === '2',
    title: event.summary || '',
    startTime: moment(event.start.dateTime),
    genres: (fields.Жанр || '').split(/\s*,\s*/).filter(Boolean),
    description: fields.Описание || '',
    location: (event.location || '').trim(),
    entry: fields.Вход || ''
  };
}

export async function getDailyConcerts(day: moment.Moment): Promise<Concert[]> {
  return await getConcerts(day.clone().startOf('day'), day.clone().endOf('day'));
}

export async function getWeeklyConcerts(week: moment.Moment): Promise<Concert[]> {
  return await getConcerts(week.clone().startOf('week'), week.clone().endOf('week'));
}

export function getConcertString(concert: Concert): string {
  return `🎸(${concert.genres.join(', ')}) - ${concert.title}
${concert.description}
🎯Где: ${concert.location}
Во сколько: ${concert.startTime.format('HH:mm')}
💵Вход: ${concert.entry}`;
}

export function getConcertsString(concerts: Concert[]): string {
  return concerts.map(getConcertString).join('\n\n');
}

export function getConcertsByDaysString(groups: Record<string, Concert[]>): string {
  return _.map(groups, (concerts, startTime) => (
    `——————————————
📌 ${capitalizeWords(moment(+startTime).format('DD MMMM - dddd'))}
——————————————

${getConcertsString(concerts)}`
  )).join('\n\n');
}

export function capitalizeWords(string: string): string {
  return string.split(' ').map(_.capitalize).join(' ');
}

export function getWeekString(week: moment.Moment): string {
  const endOfWeek = week.clone().endOf('week');

  return capitalizeWords(
    endOfWeek.isSame(week, 'month')
      ? `${week.format('DD')}-${endOfWeek.format('DD MMMM')}`
      : `${week.format('DD MMMM')} - ${endOfWeek.format('D MMMM')}`
  );
}

export async function postPoster(day: moment.Moment) {
  let posterText = '';

  if (day.weekday() === 0) {
    const concerts = await getWeeklyConcerts(day);

    if (concerts.length) {
      const groups = getConcertsByDays(concerts);

      posterText = `🥃 Афиша выступлений местных музыкантов на ${getWeekString(day)} от @soundcheck_ural (Soundcheck – Музыка Екатеринбурга).

${getConcertsByDaysString(groups)}`;
    }
  } else {
    const concerts = await getDailyConcerts(day);

    if (concerts.length) {
      posterText = `🥃 Афиша выступлений местных музыкантов на ${day.format('DD MMM')} от @soundcheck_ural (Soundcheck – Музыка Екатеринбурга).`;
    }
  }

  await sendVKRequest('wall.post', {
    owner_id: -SOUNDCHECK_ID,
    from_group: 1,
    message: posterText,
    publish_date: +day.clone().startOf('day').hours(12) / 1000
  });
}
