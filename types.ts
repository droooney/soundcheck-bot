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

export interface ConversationsResponse {
  response: {
    count: number;
    items: {
      conversation: {
        peer: { id: number; };
      };
      last_message: Message;
    }[];
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
  dest: BackButtonDest;
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

export interface AudioMaterialsButtonPayload {
  command: 'audio_materials';
}

export interface DigestsButtonPayload {
  command: 'audio_materials/digests';
}

export interface PodcastsButtonPayload {
  command: 'audio_materials/podcasts';
}

export interface ReleasesButtonPayload {
  command: 'releases';
}

export interface DrawingsButtonPayload {
  command: 'drawings';
}

export interface DrawingButtonPayload {
  command: 'drawings/drawing';
  drawingId: string;
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

export interface CollaborationButtonPayload {
  command: 'collaboration';
}

export interface ServicesButtonPayload {
  command: 'services';
}

export interface ServiceButtonPayload {
  command: 'services/service';
  service: Service;
}

export interface SubscriptionsButtonPayload {
  command: 'subscriptions';
}

export interface AdminButtonPayload {
  command: 'admin';
}

export interface AdminDrawingsButtonPayload {
  command: 'admin/drawings';
}

export interface AdminDrawingButtonPayload {
  command: 'admin/drawings/drawing';
  drawingId: string;
}

export interface AdminDrawingsAddButtonPayload {
  command: 'admin/drawings/add';
}

export interface AdminEditDrawingNameButtonPayload {
  command: 'admin/drawings/drawing/edit_name';
  drawingId: string;
}

export interface AdminEditDrawingPostButtonPayload {
  command: 'admin/drawings/drawing/edit_post';
  drawingId: string;
}

export interface AdminDeleteDrawingButtonPayload {
  command: 'admin/drawings/drawing/delete';
  drawingId: string;
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
  | ReleasesButtonPayload
  | TextMaterialsButtonPayload
  | LongreadButtonPayload
  | GroupHistoryButtonPayload
  | AudioMaterialsButtonPayload
  | DigestsButtonPayload
  | PodcastsButtonPayload
  | DrawingsButtonPayload
  | DrawingButtonPayload
  | ForMusiciansButtonPayload
  | TellAboutGroupButtonPayload
  | TellAboutReleaseButtonPayload
  | CollaborationButtonPayload
  | ServicesButtonPayload
  | ServiceButtonPayload
  | SubscriptionsButtonPayload
  | AdminButtonPayload
  | AdminDrawingsButtonPayload
  | AdminDrawingButtonPayload
  | AdminDrawingsAddButtonPayload
  | AdminEditDrawingNameButtonPayload
  | AdminEditDrawingPostButtonPayload
  | AdminDeleteDrawingButtonPayload
  | RefreshKeyboardButtonPayload
);

export enum BackButtonDest {
  MAIN = 'main',
  POSTER = 'poster',
  ADMIN = 'admin',
  ADMIN_DRAWINGS = 'admin/drawings',
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
  date?: string;
  dateTime?: string;
  timeZone?: string;
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
  postId: number;
  postOwnerId: number;
}

export type DrawingParams = Omit<Drawing, 'id'>;

export interface TellAboutGroupUserState {
  type: 'for_musicians/tell_about_group';
}

export interface TellAboutReleaseUserState {
  type: 'for_musicians/tell_about_release';
}

export interface CollaborationUserState {
  type: 'collaboration';
}

export interface AdminAddDrawingSetNameUserState {
  type: 'admin/drawings/add/set-name';
}

export interface AdminAddDrawingSetPostIdUserState {
  type: 'admin/drawings/add/set-postId';
  name: string;
}

export interface AdminDeleteDrawingUserState {
  type: 'admin/drawings/drawing/delete';
  drawingId: string;
}

export type UserState = (
  null
  | TellAboutGroupUserState
  | TellAboutReleaseUserState
  | CollaborationUserState
  | AdminAddDrawingSetNameUserState
  | AdminAddDrawingSetPostIdUserState
  | AdminDeleteDrawingUserState
);

export enum Subscription {
  POSTER = 'POSTER',
  PLAYLISTS = 'PLAYLISTS',
  RELEASES = 'RELEASES',
  TEXT_MATERIALS = 'TEXT_MATERIALS',
  AUDIO_MATERIALS = 'AUDIO_MATERIALS',
  DRAWINGS = 'DRAWINGS',
  SERVICES = 'SERVICES',
}

export interface User {
  id: number;
  state: UserState;
  subscriptions: Subscription[];
}
