import * as _ from 'lodash';
import moment = require('moment-timezone');

import { Concert, Event, Genre } from '../types';
import { genreMatches, genreNames } from '../constants';
import { capitalizeWords } from './common';
import { getEvents } from './google';

export async function getConcerts(dateStart?: moment.Moment, dateEnd?: moment.Moment): Promise<Concert[]> {
  return (await getEvents('soundcheck.ekb@gmail.com', dateStart, dateEnd)).map(getConcertFromEvent).filter(isConcertReady);
}

export function getConcertsByDays(concerts: Concert[]): Record<string, Concert[]> {
  return _.groupBy(concerts, (concert) => +concert.startTime.clone().startOf('day'));
}

export function getConcertFields(description?: string): Partial<Record<string, string>> {
  const fields: Partial<Record<string, string>> = {};
  let string = `\n${description || ''}`;
  let prevKey = '';

  while (string) {
    const match = string.match(/\n+([^:\n]*):/i);

    if (!match) {
      fields[prevKey] = string.trim();

      break;
    }

    if (prevKey) {
      fields[prevKey] = string.slice(0, match.index).trim();
    }

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
    entry: fields.Вход || '',
    buyTicket: fields['Купить билет'] || '',
    fields,
  };
}

export function isConcertReady(concert: Concert): boolean {
  return (
    concert.ready
    && concert.startTime.isValid()
    && !!concert.title
    && !!concert.genres.length
    && !!concert.description
    && !!concert.location
    && !!concert.entry
  );
}

export function isConcertInGenre(concert: Concert, genre: Genre) {
  return concert.genres.some((g) => g.toLowerCase() === genreNames[genre].toLowerCase() || genreMatches[genre].includes(g.toLowerCase()));
}

export async function getDailyConcerts(day: moment.Moment): Promise<Concert[]> {
  const startOfDay = day.clone().startOf('day');

  return (await getConcerts(startOfDay, day.clone().endOf('day'))).filter(({ startTime }) => startTime.isSameOrAfter(startOfDay));
}

export async function getWeeklyConcerts(week: moment.Moment): Promise<Concert[]> {
  return await getConcerts(week.clone().startOf('week'), week.clone().endOf('week'));
}

export function getConcertString(concert: Concert): string {
  return `🎸(${concert.genres.join(', ')}) - ${concert.title}
${concert.description}
🎯Где: ${concert.location}
Во сколько: ${concert.startTime.format('HH:mm')}
💵Вход: ${concert.entry}${concert.buyTicket ? `
➡Купить билет: ${concert.buyTicket}` : ''}`;
}

export function getConcertsString(concerts: Concert[]): string {
  return concerts.map(getConcertString).join('\n\n');
}

export function getConcertsGroupString(concerts: Concert[], startTime: string): string {
  return `——————————
📌 ${capitalizeWords(moment(+startTime).format('DD MMMM - dddd'))}
——————————

${getConcertsString(concerts)}`;
}

export function getConcertsByDaysString(groups: Record<string, Concert[]>): string {
  return _.map(groups, getConcertsGroupString).join('\n\n');
}

export function getConcertsByDaysStrings(groups: Record<string, Concert[]>, header: string): string[] {
  const strings: string[] = [header];

  _.forEach(groups, (group, startTime) => {
    const currentString = _.last(strings);
    const groupString = getConcertsGroupString(group, startTime);

    if (currentString === undefined) {
      strings.push(groupString);
    } else {
      const newString = `${currentString}\n\n${groupString}`;

      if (newString.length > 3500) {
        strings.push(groupString);
      } else {
        strings[strings.length - 1] = newString;
      }
    }
  });

  return strings;
}
