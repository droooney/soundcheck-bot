import { Genre } from './types';

export const defaultVKQuery = {
  v: '5.101',
  access_token: '2d0c91d1f4f816ed81c83008fa171fe5642e9153de1bebdf08f993392675512944a731975ad559157906b',
};

export const genreNames: Record<Genre, string> = {
  [Genre.ROCK]: 'рок',
  [Genre.INDIE]: 'инди',
  [Genre.HIP_HOP]: 'хип-хоп',
  [Genre.ELECTRONIC]: 'электроника',
  [Genre.COVERS]: 'каверы',
  [Genre.JAZZ]: 'джаз',
  [Genre.POP]: 'поп',
  [Genre.METAL]: 'иетал',
  [Genre.POST]: 'пост и мета'
};

export const genreMatches: Record<Genre, string[]> = {
  [Genre.ROCK]: [
    'панк', 'альтернатива', 'метал', 'хардкор', 'пост-рок', 'пост-хардкор',
    'блюз-рок', 'рок-н-ролл', 'русский рок', 'поп-панк', 'поп-рок', 'пост-гранж'
  ],
  [Genre.INDIE]: [],
  [Genre.HIP_HOP]: ['инди-рок', 'инди-поп'],
  [Genre.ELECTRONIC]: ['хаус'],
  [Genre.COVERS]: [],
  [Genre.JAZZ]: ['блюз', 'брасс'],
  [Genre.POP]: ['электропоп', 'диско', 'инди-поп'],
  [Genre.METAL]: [],
  [Genre.POST]: []
};

export const GENRES_BUTTONS = [
  [Genre.ROCK, Genre.INDIE, Genre.HIP_HOP],
  [Genre.ELECTRONIC, Genre.COVERS, Genre.JAZZ],
  [Genre.POP, Genre.METAL, Genre.POST]
];

export const SOUNDCHECK_ID = 164134127;
export const TELL_ABOUT_GROUP_HASHTAG = '#tell_about_group';
export const RELEASE_HASHTAG = '#release';
export const TELL_ABOUT_GROUP_TARGET = 175810060;
export const RELEASES_TARGET = 175810060;
export const NOTIFY_ABOUT_POSTER_TARGET = 175810060;
