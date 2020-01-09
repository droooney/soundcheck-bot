import axios, { AxiosResponse, Method } from 'axios';
import * as fs from 'fs-extra';
import * as jwt from 'jsonwebtoken';
import moment = require('moment-timezone');
import * as path from 'path';
import * as qs from 'querystring';
import * as stream from 'stream';
import * as uuid from 'uuid';

import { Event, EventsResponse, File, FileMetadata, FilesResponse } from '../types';
import { timeout } from './common';

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
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' '),
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

export interface SendGoogleRequestOptions {
  url: string;
  method: Method;
  headers?: object;
  query?: object;
  data?: any;
}

export async function sendGoogleRequest<T>(options: SendGoogleRequestOptions): Promise<AxiosResponse<T>> {
  let i = 0;

  while (i++ < 5) {
    try {
      return await trySendGoogleRequest(options);
    } catch (err) {
      if (err.response.data.error && err.response.data.error.code === 401) {
        await refreshGoogleAccessToken();
      } else {
        throw err;
      }
    }
  }

  return trySendGoogleRequest(options);
}

export function trySendGoogleRequest<T>(options: SendGoogleRequestOptions): Promise<AxiosResponse<T>> {
  return axios.request({
    url: `${options.url}${options.query ? `?${qs.stringify(options.query as any)}` : ''}`,
    method: options.method,
    headers: {
      Authorization: `Bearer ${googleAPIAccessToken}`,
      ...options.headers
    },
    data: options.data,
  });
}

export async function getEvents(calendarId: string, dateStart?: moment.Moment, dateEnd?: moment.Moment): Promise<Event[]> {
  const events: Event[] = [];
  let pageToken: string | undefined;

  while (true) {
    const { data } = await sendGoogleRequest<EventsResponse>({
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      method: 'get',
      query: {
        maxResults: 2500,
        pageToken,
        orderBy: 'startTime',
        singleEvents: true,
        ...(dateStart ? { timeMin: dateStart.toISOString(true) } : {}),
        ...(dateEnd ? { timeMax: dateEnd.toISOString(true) } : {})
      }
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

export async function getHolidays(dateStart: moment.Moment, dateEnd: moment.Moment): Promise<moment.Moment[]> {
  dateStart = dateStart.clone().startOf('day');
  dateEnd = dateEnd.clone().endOf('day').add(1, 'ms');

  return (await getEvents('ru.russian#holiday@group.v.calendar.google.com', dateStart, dateEnd)).map(({ start }) => moment(start.date));
}

export async function getAllGoogleDriveFiles(): Promise<File[]> {
  const {
    data: {
      files: fileIds
    }
  } = await sendGoogleRequest<FilesResponse>({
    url: 'https://www.googleapis.com/drive/v3/files',
    method: 'get',
    query: {
      pageSize: 1000
    }
  });
  const files: File[] = [];

  for (const { id } of fileIds) {
    files.push(
      (await sendGoogleRequest<File>({
        url: `https://www.googleapis.com/drive/v3/files/${id}`,
        method: 'get',
        query: {
          fields: 'kind, id, name, mimeType, shared, parents'
        }
      })).data
    );

    await timeout(5000);
  }

  return files;
}

export async function uploadFile(filename: string, mimeType: string, parentFolder?: string) {
  const metadata: FileMetadata = {
    mimeType,
    name: path.basename(filename)
  };

  if (parentFolder) {
    metadata.parents = [parentFolder];
  }

  const multipart: [{ contentType: string; body: string; }, { contentType: string; body: stream.Readable; }] = [
    { contentType: 'application/json', body: JSON.stringify(metadata) },
    { contentType: mimeType, body: fs.createReadStream(filename) },
  ];
  const boundary = uuid.v4();
  const finale = `--${boundary}--`;
  const rStream = new stream.PassThrough({
    flush(callback) {
      this.push('\r\n');
      this.push(finale);
      callback();
    }
  });

  for (const part of multipart) {
    const preamble = `--${boundary}\r\nContent-Type: ${part.contentType}\r\n\r\n`;

    rStream.push(preamble);

    if (typeof part.body === 'string') {
      rStream.push(part.body);
      rStream.push('\r\n');
    } else {
      part.body.pipe(rStream);
    }
  }

  await sendGoogleRequest({
    url: 'https://www.googleapis.com/upload/drive/v3/files',
    method: 'post',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    query: {
      uploadType: 'multipart'
    },
    data: rStream
  });
}

export async function removeFile(file: File) {
  await sendGoogleRequest({
    url: `https://www.googleapis.com/drive/v3/files/${file.id}`,
    method: 'delete'
  });
}
