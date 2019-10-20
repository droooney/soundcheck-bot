import { Moment } from 'moment';

export interface Message {
  id: number;
  peer_id: number;
  text: string;
  payload?: string;
}

export interface BaseBody {
  group_id: number;
}

export interface ConfirmationBody extends BaseBody {
  type: 'confirmation';
}

export interface NewMessageBody extends BaseBody {
  type: 'message_new';
  object: Message;
}

export type Body = ConfirmationBody | NewMessageBody;

export interface StartButtonPayload {
  command: 'start';
}

export interface BackButtonPayload {
  command: 'back';
  dest: string;
}

export interface PosterButtonPayload {
  command: 'poster';
}

export interface PosterTypeButtonPayload {
  command: 'poster_type';
  type: 'day' | 'week' | 'genres';
}

export interface PosterDayButtonPayload {
  command: 'poster_day';
  dayStart: number;
}

export interface PosterWeekButtonPayload {
  command: 'poster_week';
  weekStart: number;
}

export interface PosterGenreButtonPayload {
  command: 'poster_genre';
  genre: string;
}

export interface PlaylistButtonPayload {
  command: 'playlist';
}

export interface LongreadButtonPayload {
  command: 'longread'
}

export interface ReleasesButtonPayload {
  command: 'releases';
}

export interface ServicesButtonPayload {
  command: 'services';
}

export interface ServiceButtonPayload {
  command: 'service';
  serviceId: string;
}

export interface TellAboutGroupButtonPayload {
  command: 'tell_about_group';
}

export interface TellAboutReleaseButtonPayload {
  command: 'tell_about_release';
}

export interface RefreshKeyboardButtonPayload {
  command: 'refresh_keyboard';
}

export type ButtonPayload = (
  StartButtonPayload
  | BackButtonPayload
  | PosterButtonPayload
  | PosterTypeButtonPayload
  | PosterDayButtonPayload
  | PosterWeekButtonPayload
  | PosterGenreButtonPayload
  | PlaylistButtonPayload
  | LongreadButtonPayload
  | ReleasesButtonPayload
  | ServicesButtonPayload
  | ServiceButtonPayload
  | TellAboutGroupButtonPayload
  | TellAboutReleaseButtonPayload
  | RefreshKeyboardButtonPayload
);

export enum BackButtonDest {
  MAIN = 'main',
  POSTER = 'poster'
}

export interface BaseButtonAction {
  payload?: string;
}

export interface TextButtonAction extends BaseButtonAction {
  type: 'text';
  label: string;
}

export interface LocationButtonAction extends BaseButtonAction {
  type: 'location';
}

export type ButtonAction = TextButtonAction | LocationButtonAction;

export enum ButtonColor {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  NEGATIVE = 'negative',
  POSITIVE = 'positive'
}

export interface KeyboardButton {
  action: ButtonAction;
  color: ButtonColor;
}

export interface Keyboard {
  one_time?: boolean;
  buttons: KeyboardButton[][];
}

export interface DateObject {
  dateTime: string;
  timeZone: string;
}

export interface Event {
  start: DateObject;
  colorId?: string;
  summary?: string;
  description?: string;
  location?: string;
}

export interface Concert {
  ready: boolean;
  title: string;
  startTime: Moment;
  genres: string[];
  description: string;
  location: string;
  entry: string;
}

export interface EventsResponse {
  nextPageToken?: string;
  items?: Event[];
}
