import { Genre } from './types';

export const defaultVKQuery = {
  v: '5.101',
  access_token: '2d0c91d1f4f816ed81c83008fa171fe5642e9153de1bebdf08f993392675512944a731975ad559157906b',
};

export const genreNames: Record<Genre, string> = {
  [Genre.ROCK]: 'Рок',
  [Genre.INDIE]: 'Инди',
  [Genre.HIP_HOP]: 'Хип-хоп',
  [Genre.ELECTRONIC]: 'Электроника',
  [Genre.COVERS]: 'Каверы',
  [Genre.JAZZ]: 'Джаз',
  [Genre.POP]: 'Поп',
  [Genre.FOLK]: 'Фолк',
  [Genre.ABOUT_MUSIC]: 'На тему музыки'
};

export const genreMatches: Record<Genre, string[]> = {
  [Genre.ROCK]: [
    'панк', 'панк-рок', 'альтернатива', 'альтернативный рок', 'метал', 'мелодик метал',
    'хард-рок', 'трэш-метал', 'ню-метал', 'блэк-метал', 'хардкор', 'пост-рок', 'пост-хардкор',
    'блюз-рок', 'рок-н-ролл', 'русский рок', 'поп-панк', 'поп-рок', 'пост-гранж', 'индастриал',
    'дарк-индастриал', 'дрим-рок', 'инди-рок'
  ],
  [Genre.INDIE]: ['инди-рок', 'инди-поп', 'инди-фолк'],
  [Genre.HIP_HOP]: ['рэп', 'реп', 'баттл', 'батл', 'баттл-рэп', 'батл-рэп', 'old school', 'new school'],
  [Genre.ELECTRONIC]: ['хаус', 'эмбиент', 'чиптюн', 'фьюжн', 'dj'],
  [Genre.COVERS]: [],
  [Genre.JAZZ]: ['блюз', 'брасс', 'дикселенд', 'фанк'],
  [Genre.POP]: ['электро-поп', 'диско', 'инди-поп', 'синти-поп', 'r\'n\'b', 'соул', 'синт', 'synth'],
  [Genre.FOLK]: ['фолк-рок', 'инди-фолк', 'народная музыка', 'этника', 'этническая музыка'],
  [Genre.ABOUT_MUSIC]: ['лекция', 'выставка', 'кино']
};

export const GENRES_BUTTONS = [
  [Genre.ROCK, Genre.INDIE, Genre.HIP_HOP],
  [Genre.ELECTRONIC, Genre.COVERS, Genre.JAZZ],
  [Genre.POP, Genre.FOLK, Genre.ABOUT_MUSIC]
];

export const confirmPositiveAnswers = ['yes', 'да', '+', 'ok', 'ок'];

export const SOUNDCHECK_ID = 164134127;
export const TELL_ABOUT_GROUP_HASHTAG = '#tell_about_group';
export const RELEASE_HASHTAG = '#release';
export const TELL_ABOUT_GROUP_TARGET = 175810060;
export const RELEASES_TARGET = 175810060;
export const NOTIFY_ABOUT_POSTER_TARGET = 175810060;
