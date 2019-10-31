import { Moment } from 'moment';

export interface Message {
  id: number;
  peer_id: number;
  text: string;
  payload?: string;
  attachments: Attachment[];
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

export interface ChangeManagerBody extends BaseBody {
  type: 'group_officers_edit';
  object: {
    admin_id: number;
    user_id: number;
    level_old: number;
    level_new: number;
  };
}

export type Body = ConfirmationBody | NewMessageBody | ChangeManagerBody;

export interface ManagersResponse {
  response: {
    count: number;
    items: { id: number; role: string; permissions: string[]; }[];
  };
}

export interface WallAttachment {
  type: 'wall';
  wall: {
    id: number;
    to_id: number;
  };
}

export type Attachment = WallAttachment;

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
  command: 'poster/type';
  type: 'day' | 'week' | 'genres';
}

export interface PosterDayButtonPayload {
  command: 'poster/type/day';
  dayStart: number;
}

export interface PosterWeekButtonPayload {
  command: 'poster/type/week';
  weekStart: number;
}

export interface PosterGenreButtonPayload {
  command: 'poster/type/genre';
  genre: Genre;
}

export interface PlaylistButtonPayload {
  command: 'playlist';
}

export interface TextMaterialsButtonPayload {
  command: 'text_materials';
}

export interface LongreadButtonPayload {
  command: 'text_materials/longread';
}

export interface GroupHistoryButtonPayload {
  command: 'text_materials/group_history';
}

export interface ReleasesButtonPayload {
  command: 'releases';
}

export interface ForMusiciansButtonPayload {
  command: 'for_musicians';
}

export interface TellAboutGroupButtonPayload {
  command: 'for_musicians/tell_about_group';
}

export interface TellAboutReleaseButtonPayload {
  command: 'for_musicians/tell_about_release';
}

export interface ServicesButtonPayload {
  command: 'for_musicians/services';
}

export interface ServiceButtonPayload {
  command: 'for_musicians/services/service';
  service: Service;
}

export interface CollaborationButtonPayload {
  command: 'collaboration';
}

export interface AdminButtonPayload {
  command: 'admin';
}

export interface AdminDrawingsButtonPayload {
  command: 'admin/drawings';
}

export interface AdminDrawingsAddButtonPayload {
  command: 'admin/drawings/add';
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
  | TextMaterialsButtonPayload
  | LongreadButtonPayload
  | GroupHistoryButtonPayload
  | ReleasesButtonPayload
  | ForMusiciansButtonPayload
  | TellAboutGroupButtonPayload
  | TellAboutReleaseButtonPayload
  | ServicesButtonPayload
  | ServiceButtonPayload
  | CollaborationButtonPayload
  | AdminButtonPayload
  | AdminDrawingsButtonPayload
  | AdminDrawingsAddButtonPayload
  | RefreshKeyboardButtonPayload
);

export enum BackButtonDest {
  MAIN = 'main',
  POSTER = 'poster',
  FOR_MUSICIANS = 'for_musicians',
  ADMIN = 'admin',
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

export enum Genre {
  ROCK = 'ROCK',
  INDIE = 'INDIE',
  HIP_HOP = 'HIP_HOP',
  ELECTRONIC = 'ELECTRONIC',
  COVERS = 'COVERS',
  JAZZ = 'JAZZ',
  POP = 'POP',
  FOLK = 'FOLK',
  ABOUT_MUSIC = 'ABOUT_MUSIC',
}

export interface MarketService {
  type: 'market';
  id: string;
}

export type Service = MarketService;

export interface Drawing {
  id: string;
  name: string;
  description: string;
  postId: number;
  postOwnerId: number;
}

export type DrawingParams = Omit<Drawing, 'id'>;

export interface AddDrawingSetNameUserState {
  type: 'admin/drawings/add/set-name';
}

export interface AddDrawingSetDescriptionUserState {
  type: 'admin/drawings/add/set-description';
  name: string;
}

export interface AddDrawingSetPostIdUserState {
  type: 'admin/drawings/add/set-postId';
  name: string;
  description: string;
}

export type UserState = null | (
  AddDrawingSetNameUserState
  | AddDrawingSetDescriptionUserState
  | AddDrawingSetPostIdUserState
);
