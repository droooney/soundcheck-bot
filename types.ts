import { Moment } from 'moment';

export interface Message {
  id: number;
  date: number;
  peer_id: number;
  conversation_message_id: number;
  text: string;
  payload?: string;
  attachments: Attachment[];
}

export interface Post {
  id: number;
  owner_id: number;
  text: string;
  attachments?: Attachment[];
  copy_history?: Post[];
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

export interface UserLeaveBody extends BaseBody {
  type: 'group_leave';
  object: {
    user_id: number;
    self: 0 | 1;
  };
}

export interface UserJoinBody extends BaseBody {
  type: 'group_join';
  object: {
    user_id: number;
    join_type: 'join' | 'unsure' | 'accepted' | 'approved' | 'request';
  };
}

export interface NewPostBody extends BaseBody {
  type: 'wall_post_new';
  object: Post;
}

export interface RepostBody {
  type: 'wall_repost';
  object: Post;
}

export type Body = (
  ConfirmationBody
  | NewMessageBody
  | ChangeManagerBody
  | UserLeaveBody
  | UserJoinBody
  | NewPostBody
  | RepostBody
);

export interface ManagersResponse {
  count: number;
  items: { id: number; role: string; permissions: string[]; }[];
}

export interface ConversationsResponse {
  count: number;
  items: {
    conversation: {
      peer: { id: number; };
    };
    last_message: Message;
  }[];
}

export type SendMessageResponse = (
  { peer_id: number; message_id: number; }
  | { peer_id: number; error: { code: number; description: string; }; }
)[];

export interface WallAttachment {
  type: 'wall';
  wall: {
    id: number;
    to_id: number;
  };
}

export interface PhotoAttachment {
  type: 'photo';
  photo: {
    id: number;
    owner_id: number;
    text: string;
  };
}

export type Attachment = WallAttachment | PhotoAttachment;

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

export interface SubscribeToPosterButtonPayload {
  command: 'poster/subscribe';
  subscribed: boolean;
}

export interface PlaylistsButtonPayload {
  command: 'playlists';
}

export interface PlaylistsAllButtonPayload {
  command: 'playlists/all';
}

export interface PlaylistsThematicButtonPayload {
  command: 'playlists/thematic';
}

export interface PlaylistsGenreButtonPayload {
  command: 'playlists/genre';
}

export interface SubscribeToPlaylistsButtonPayload {
  command: 'playlists/subscribe';
  subscribed: boolean;
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

export interface SubscribeToTextMaterialsButtonPayload {
  command: 'text_materials/subscribe';
  subscribed: boolean;
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

export interface SubscribeToAudioMaterialsButtonPayload {
  command: 'audio_materials/subscribe';
  subscribed: boolean;
}

export interface ReleasesButtonPayload {
  command: 'releases';
}

export interface DrawingsButtonPayload {
  command: 'drawings';
}

export interface DrawingButtonPayload {
  command: 'drawings/drawing';
  drawingId: number;
}

export interface SubscribeToDrawingsButtonPayload {
  command: 'drawings/subscribe';
  subscribed: boolean;
}

export interface WriteToSoundcheckButtonPayload {
  command: 'write_to_soundcheck';
}

export interface TellAboutGroupButtonPayload {
  command: 'write_to_soundcheck/tell_about_group';
}

export interface TellAboutReleaseButtonPayload {
  command: 'write_to_soundcheck/tell_about_release';
}

export interface CollaborationButtonPayload {
  command: 'write_to_soundcheck/collaboration';
}

export interface TellAboutBugButtonPayload {
  command: 'write_to_soundcheck/tell_about_bug';
}

export interface WantToParticipateInSoundcheckButtonPayload {
  command: 'write_to_soundcheck/want_to_participate';
}

export interface WriteToSoundcheckOtherButtonPayload {
  command: 'write_to_soundcheck/other';
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

export interface SubscriptionButtonPayload {
  command: 'subscriptions/subscription';
  subscription: Subscription;
  subscribed: boolean;
}

export interface AdminButtonPayload {
  command: 'admin';
}

export interface AdminDrawingsButtonPayload {
  command: 'admin/drawings';
}

export interface AdminDrawingButtonPayload {
  command: 'admin/drawings/drawing';
  drawingId: number;
}

export interface AdminDrawingsAddButtonPayload {
  command: 'admin/drawings/add';
}

export interface AdminEditDrawingNameButtonPayload {
  command: 'admin/drawings/drawing/edit_name';
  drawingId: number;
}

export interface AdminEditDrawingPostButtonPayload {
  command: 'admin/drawings/drawing/edit_post';
  drawingId: number;
}

export interface AdminEditDrawingExpiresAtButtonPayload {
  command: 'admin/drawings/drawing/edit_expires_at';
  drawingId: number;
}

export interface AdminDeleteDrawingButtonPayload {
  command: 'admin/drawings/drawing/delete';
  drawingId: number;
}

export interface AdminStatsButtonPayload {
  command: 'admin/stats';
}

export interface AdminSubscriptionStatsButtonPayload {
  command: 'admin/stats/subscriptions';
}

export interface AdminSubscriptionStatsPeriodButtonPayload {
  command: 'admin/stats/subscriptions/period';
  period: StatsPeriod;
}

export interface AdminClickStatsButtonPayload {
  command: 'admin/stats/clicks';
}

export interface AdminClickStatsPeriodButtonPayload {
  command: 'admin/stats/clicks/period';
  period: StatsPeriod;
}

export interface AdminGroupStatsButtonPayload {
  command: 'admin/stats/group';
}

export interface AdminGroupStatsPeriodButtonPayload {
  command: 'admin/stats/group/period';
  period: StatsPeriod;
}

export interface AdminRepostStatsButtonPayload {
  command: 'admin/stats/reposts';
}

export interface AdminRepostStatsPeriodButtonPayload {
  command: 'admin/stats/reposts/period';
  period: StatsPeriod;
}

export interface RefreshKeyboardButtonPayload {
  command: 'refresh_keyboard';
}

export type SubscribeToSectionButtonPayload = (
  SubscribeToPosterButtonPayload
  | SubscribeToPlaylistsButtonPayload
  | SubscribeToTextMaterialsButtonPayload
  | SubscribeToAudioMaterialsButtonPayload
  | SubscribeToDrawingsButtonPayload
);

export type ButtonPayload = (
  StartButtonPayload
  | BackButtonPayload
  | PosterButtonPayload
  | PosterTypeButtonPayload
  | PosterDayButtonPayload
  | PosterWeekButtonPayload
  | PosterGenreButtonPayload
  | SubscribeToPosterButtonPayload
  | PlaylistsButtonPayload
  | PlaylistsAllButtonPayload
  | PlaylistsThematicButtonPayload
  | PlaylistsGenreButtonPayload
  | SubscribeToPlaylistsButtonPayload
  | ReleasesButtonPayload
  | TextMaterialsButtonPayload
  | LongreadButtonPayload
  | GroupHistoryButtonPayload
  | SubscribeToTextMaterialsButtonPayload
  | AudioMaterialsButtonPayload
  | DigestsButtonPayload
  | PodcastsButtonPayload
  | SubscribeToAudioMaterialsButtonPayload
  | DrawingsButtonPayload
  | DrawingButtonPayload
  | SubscribeToDrawingsButtonPayload
  | WriteToSoundcheckButtonPayload
  | TellAboutGroupButtonPayload
  | TellAboutReleaseButtonPayload
  | CollaborationButtonPayload
  | TellAboutBugButtonPayload
  | WantToParticipateInSoundcheckButtonPayload
  | WriteToSoundcheckOtherButtonPayload
  | ServicesButtonPayload
  | ServiceButtonPayload
  | SubscriptionsButtonPayload
  | SubscriptionButtonPayload
  | AdminButtonPayload
  | AdminDrawingsButtonPayload
  | AdminDrawingButtonPayload
  | AdminDrawingsAddButtonPayload
  | AdminEditDrawingNameButtonPayload
  | AdminEditDrawingPostButtonPayload
  | AdminEditDrawingExpiresAtButtonPayload
  | AdminDeleteDrawingButtonPayload
  | AdminStatsButtonPayload
  | AdminSubscriptionStatsButtonPayload
  | AdminSubscriptionStatsPeriodButtonPayload
  | AdminClickStatsButtonPayload
  | AdminClickStatsPeriodButtonPayload
  | AdminGroupStatsButtonPayload
  | AdminGroupStatsPeriodButtonPayload
  | AdminRepostStatsButtonPayload
  | AdminRepostStatsPeriodButtonPayload
  | RefreshKeyboardButtonPayload
);

export enum BackButtonDest {
  MAIN = 'main',
  POSTER = 'poster',
  ADMIN = 'admin',
  ADMIN_DRAWINGS = 'admin/drawings',
  ADMIN_STATS = 'admin/stats',
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
  inline?: boolean;
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

export interface File {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
  shared: boolean;
  parents?: string[];
}

export interface FileMetadata {
  mimeType: string;
  name: string;
  parents?: string[];
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

export interface FilesResponse {
  files: { id: string; }[];
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

export type Service = 'stickers_design' | 'soundcheck_ads';

export interface TellAboutGroupUserState {
  command: 'write_to_soundcheck/tell_about_group/message';
}

export interface TellAboutReleaseUserState {
  command: 'write_to_soundcheck/tell_about_release/message';
}

export interface CollaborationUserState {
  command: 'write_to_soundcheck/collaboration/message';
}

export interface TellAboutBugUserState {
  command: 'write_to_soundcheck/tell_about_bug/message';
}

export interface WantToParticipateUserState {
  command: 'write_to_soundcheck/want_to_participate/message';
}

export interface WriteToSoundcheckOtherUserState {
  command: 'write_to_soundcheck/other/message';
}

export interface AdminAddDrawingSetNameUserState {
  command: 'admin/drawings/add/set_name';
}

export interface AdminAddDrawingSetPostUserState {
  command: 'admin/drawings/add/set_post';
  name: string;
}

export interface AdminAddDrawingSetExpiresAtUserState {
  command: 'admin/drawings/add/set_expires_at';
  name: string;
  postId: string;
}

export interface AdminEditDrawingNameUserState {
  command: 'admin/drawings/drawing/edit_name/message';
  drawingId: number;
}

export interface AdminEditDrawingPostUserState {
  command: 'admin/drawings/drawing/edit_post/message';
  drawingId: number;
}

export interface AdminEditDrawingExpiresAtUserState {
  command: 'admin/drawings/drawing/edit_expires_at/message';
  drawingId: number;
}

export interface AdminDeleteDrawingUserState {
  command: 'admin/drawings/drawing/delete/confirmation';
  drawingId: number;
}

export type UserState = (
  null
  | TellAboutGroupUserState
  | TellAboutReleaseUserState
  | CollaborationUserState
  | TellAboutBugUserState
  | WantToParticipateUserState
  | WriteToSoundcheckOtherUserState
  | AdminAddDrawingSetNameUserState
  | AdminAddDrawingSetPostUserState
  | AdminAddDrawingSetExpiresAtUserState
  | AdminEditDrawingNameUserState
  | AdminEditDrawingPostUserState
  | AdminEditDrawingExpiresAtUserState
  | AdminDeleteDrawingUserState
);

export enum Subscription {
  POSTER = 'POSTER',
  PLAYLISTS = 'PLAYLISTS',
  RELEASES = 'RELEASES',
  TEXT_MATERIALS = 'TEXT_MATERIALS',
  AUDIO_MATERIALS = 'AUDIO_MATERIALS',
  DRAWINGS = 'DRAWINGS',
  // SERVICES = 'SERVICES',
  FOR_MUSICIANS = 'FOR_MUSICIANS',
}

export type Target = (
  'tellAboutGroup' | 'tellAboutRelease' | 'collaboration'
  | 'tellAboutBug' | 'wantToParticipate' | 'other' | 'poster' | 'stats'
);

export interface Config {
  dbConnection: DbConnection;
  port: number;
  endpoint: string;
  soundcheckId: number;
  vkToken: string;
  confirmationCode: string;
  targets: Record<Target, number[]>;
  googleDriveDumpsFolderName: string;
}

export interface ClicksGroup {
  payload: Partial<ButtonPayload>;
  count: number;
}

export interface ServiceParams {
  name: string;
  message: string;
  attachments?: string[];
}

export type StatsPeriod = 'all_time' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'prev_week' | 'prev_month';

export interface DbConnection {
  dialect: 'postgres';
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
}
