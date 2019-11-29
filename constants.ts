import * as _ from 'lodash';
import moment = require('moment-timezone');

import { Genre, Service, ServiceParams, Subscription } from './types';
import User, { Sex } from './database/User';
import Drawing from './database/Drawing';

export interface BackToMainMenuCaptionOptions {
  user: User;
  buttonsCount: number;
}

export interface BackToPosterCaptionOptions {
  user: User;
}

export interface ChoosePosterTypeCaptionOptions {
  user: User;
}

export const captions = {
  // main menu
  welcome_text: (user: User) => `Привет, ${user.firstName}. Ты ${user.sex === Sex.FEMALE ? 'активировала' : 'активировал'} чат-бота Soundcheck. \
Тебе нужно всего лишь нажать на одну из кнопок внизу экрана, и ты получишь доступ ко множеству материалов нашего паблика. \
Также ты можешь написать нам или заказать одну из услуг проекта, будь то пост, реклама или дизайн стикеров для музыкантов.`,
  main_menu: 'Главное меню',
  poster: 'Афиша',
  playlists: 'Плейлисты',
  releases: 'Релизы',
  drawings: 'Розыгрыши',
  text_materials: 'Статьи',
  audio_materials: 'Аудиоматериалы',
  write_to_soundcheck: 'Написать нам',
  services: 'Услуги',
  for_musicians: 'Для музыкантов',
  subscriptions: 'Рассылки',
  admin_section: 'Админка',
  choose_action: 'Выберите действие',
  releases_response: 'Смотри релизы тут: https://vk.com/soundcheck_ural/new_release',
  refresh_keyboard_response: 'Клавиатура обновлена',
  back_to_main_menu: [
    ({ user }: BackToMainMenuCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'вернулась' : 'вернулся'} в Главное меню. Куда отправимся дальше?`,
    ({ user }: BackToMainMenuCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'вернулась' : 'вернулся'} в Главное меню. \
Не забывай, что ты всегда можешь поддержать нас лайком, отзывом или монетой.`,
    ({ user }: BackToMainMenuCaptionOptions) => `И снова Главное меню... а ты ${user.sex === Sex.FEMALE ? 'любопытная' : 'любопытный'}.`,
    'Главное меню – это начало нового пути.',
    ({ user }: BackToMainMenuCaptionOptions) => `Ты снова ${user.sex === Sex.FEMALE ? 'перешла' : 'перешел'} в Главное меню. Пойдем за новым материалом?`,
    'Главное меню. Если бы количество лайков равнялось количеству переходов в главное меню, мы бы давно догнали МДК.',
    ({ user, buttonsCount }: BackToMainMenuCaptionOptions) => `Главное меню. Есть ${buttonsCount} кнопок, \
на какие ${user.sex === Sex.FEMALE ? 'сама' : 'сам'} тапнешь, какие другу отправишь?`,
    ({ user }: BackToMainMenuCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'вернулась' : 'вернулся'} в Главное меню. \
Уже все ${user.sex === Sex.FEMALE ? 'прочитала' : 'прочитал'}?`,
    'Снова Главное меню. Как хорошо, что у нас еще много материалов.',
    'Главное меню. Мы поняли, в следующий раз сделаем эту кнопку побольше.',
    'Нужно больше... переходов в Главное меню.',
    'Если бы нам платили по рублю за каждый переход в Главное меню, мы бы уже давно разбогатели.',
    'Главное меню. Если тебе нравится бот, ты всегда можешь оставить сердечко под нашими постами.',
    'Мы понимаем: нельзя так просто взять... и не вернуться в Главное меню.',
    'Вжух, и ты снова в Главном меню!',
  ],

  // poster
  day: 'День',
  week: 'Неделя',
  by_genres: 'По жанрам',
  this_week: 'Эта неделя',
  choose_poster_type: [
    ({ user }: ChoosePosterTypeCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'выбрала' : 'выбрал'} раздел Афиши. \
Какой формат афиши тебе больше подходит: на конкретные дни или ближайшие недели? А может тебе интересно узнать обо всех ближайших концертах \
выбранного жанра? Афиша пополняется новыми концертами раз в пару дней.`,
    `Раздел Афиши. Все просто: нужно выбрать День, Неделю или Жанр, а мы расскажем тебе обо всех известных на данный момент концертах. \
Афиша пополняется новыми концертами раз в пару дней.`,
    ({ user }: ChoosePosterTypeCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'перешла' : 'перешел'} в раздел Афиши. \
Выбор концерта – дело серьезное. Но сначала нужно выбрать формат выдачи: День, Неделя или Жанр. Афиша пополняется новыми концертами раз в пару дней.`,
    `Афиша от Soundcheck. Напомним, что ты можешь подписаться на рассылку Афиши, тогда ты не пропустишь ни одного концерта!`,
    ({ user }: ChoosePosterTypeCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'выбрала' : 'выбрал'} раздел Афиши. Напомним, \
что ты можешь подписаться на рассылку Афиши от Soundcheck, тогда ты не пропустишь ни одного концерта!`,
    `Раздел Афиши. Какой формат афиши тебе больше подходит: на конкретные дни или ближайшие недели? \
А может тебе интересно узнать обо всех ближайших концертах выбранного жанра? Афиша пополняется новыми концертами раз в пару дней.`,
    `Раздел Афиши. Выбор концерта – дело серьезное. Но сначала нужно выбрать формат выдачи: День, Неделя или Жанр. \
Афиша пополняется новыми концертами раз в пару дней.`,
    `Раздел Афиши. Напомним, что ты можешь подписаться на рассылку Афиши от Soundcheck, тогда ты не пропустишь ни одного концерта!`,
    ({ user }: ChoosePosterTypeCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'перешла' : 'перешел'} в раздел Афиши. \
Какой формат афиши тебе больше подходит: на конкретные дни или ближайшие недели? А может тебе интересно узнать обо всех \
ближайших концертах выбранного жанра? Афиша пополняется новыми концертами раз в пару дней.`,
    ({ user }: ChoosePosterTypeCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'перешла' : 'перешел'} в раздел Афиши. \
Все просто: нужно выбрать День, Неделю или Жанр, а мы расскажем тебе обо всех известных на данный момент концертах. \
Афиша пополняется новыми концертами раз в пару дней.`,
    ({ user }: ChoosePosterTypeCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'перешла' : 'перешел'} в раздел Афиши. \
Напомним, что ты можешь подписаться на рассылку Афиши от Soundcheck, тогда ты не пропустишь ни одного концерта!`,
    `Афиша от Soundcheck. Какой формат афиши тебе больше подходит: на конкретные дни или ближайшие недели? А может тебе \
интересно узнать обо всех ближайших концертах выбранного жанра? Афиша пополняется новыми концертами раз в пару дней.`,
    `Афиша от Soundcheck. Все просто: нужно выбрать День, Неделю или Жанр, а мы расскажем тебе обо всех известных \
на данный момент концертах. Афиша пополняется новыми концертами раз в пару дней.`,
    `Афиша от Soundcheck. Выбор концерта – дело серьезное. Но сначала нужно выбрать формат выдачи: День, Неделя или Жанр. \
Афиша пополняется новыми концертами раз в пару дней.`,
  ],
  no_concerts_by_day: 'В ближайшее время концертов нет',
  choose_day: [
    `Первый шаг к крутым концертам сделан. Осталось выбрать, концерты в какой день тебя интересуют! \
Новые концерты появляются каждый день, поэтому, если ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Крутые концерты уже рядом. Концерты на какой день тебя интересуют? Новые концерты появляются каждый день, поэтому, если \
ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Афиша на день. Выбери день, и мы пришлем тебе все известные концерты. Новые концерты появляются каждый день, \
поэтому, если ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Афиша на день. Какое число тебя интересует? Новые концерты появляются каждый день, поэтому, если ты не найдешь нужный концерт \
в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Первый шаг к крутым концертам сделан. Концерты на какой день тебя интересуют? Новые концерты появляются каждый день, поэтому, если \
ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Первый шаг к крутым концертам сделан. Выбери день, и мы пришлем тебе все известные концерты. Новые концерты появляются \
каждый день, поэтому, если ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Первый шаг к крутым концертам сделан. Какое число тебя интересует? Новые концерты появляются каждый день, поэтому, если \
ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Крутые концерты уже рядом. Осталось выбрать, концерты в какой день тебя интересуют! Новые концерты появляются каждый день, \
поэтому, если ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Крутые концерты уже рядом. Выбери день, и мы пришлем тебе все известные концерты. Новые концерты появляются каждый день, \
поэтому, если ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Крутые концерты уже рядом. Какое число тебя интересует? Новые концерты появляются каждый день, поэтому, если ты не найдешь \
нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Афиша на день. Осталось выбрать, концерты в какой день тебя интересуют! Новые концерты появляются каждый день, поэтому, если \
ты не найдешь нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
    `Афиша на день. Концерты на какой день тебя интересуют? Новые концерты появляются каждый день, поэтомуm если ты не найдешь \
нужный концерт в нужный день, рекомендуем вернуться ближе к выбранной дате.`,
  ],
  choose_week: 'Выберите неделю',
  choose_genre: 'Выберите жанр',
  concerts_at_day: (date: moment.Moment, concertsString: string) =>  `Афиша на ${date.format('D MMMM')}:\n\n${concertsString}`,
  no_concerts_at_day: `К сожалению, на выбранное тобой число пока не назначено концертов. Рекомендуем вернуться ближе \
к выбранной дате или рассмотреть другую.`,
  no_concerts_at_week: 'На эту неделю концертов нет',
  no_concerts_in_genre: (genre: Genre) => (
    genre === Genre.ABOUT_MUSIC
      ? 'В ближайшее время событий на тему музыки нет'
      : `В ближайшее время концертов в жанре "${genreNames[genre]}" нет`
  ),
  back_to_poster: [
    ({ user }: BackToPosterCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'вернулась' : 'вернулся'} к выбору Афиши. \
Как хорошо, что у каждого формата есть свои преимущества.`,
    ({ user }: BackToPosterCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'вернулась' : 'вернулся'} к выбору Афиши. \
Нам нравится твой подход. Концерт – дело серьезное.`,
    'Снова меню выбора формата Афиши. Если тебе что-то понравится, не поскупись на лайки, нас это очень поддерживает.',
    ({ user }: BackToPosterCaptionOptions) => `Ты ${user.sex === Sex.FEMALE ? 'вернулась' : 'вернулся'} к выбору формата Афиши. \
Да, выбор концерта – дело непростое.`,
    'Нельзя так просто взять... и не вернуться к выбору формата Афиши.',
    'Выбор формата Афиши. День, Неделя или Жанр?',
  ],

  // playlists
  playlists_all: 'Все',
  playlists_thematic: 'Тематические',
  playlists_genre: 'По жанрам',
  choose_playlists_type: 'Выберите тип плейлистов',
  playlists_all_response: 'Все плейлисты смотри тут: https://vk.com/soundcheck_ural/music_selections',
  playlists_thematic_response: 'Тематические плейлисты смотри тут: https://vk.com/soundcheck_ural/them_playlists',
  playlists_genres_response: `Альтернатива: https://vk.com/wall-177574047_1342
Панк: https://vk.com/wall-177574047_1617
Хип-хоп: https://vk.com/wall-177574047_1295
Инди: https://vk.com/wall-177574047_1142
Электроника: https://vk.com/wall-177574047_1508
Фолк: https://vk.com/wall-177574047_1397`,

  // drawings
  choose_drawing: 'Выберите розыгрыш',
  no_drawings: 'В данный момент розыгрышей нет',
  no_drawing: 'Такого розыгрыша не существует, выберите другой',
  drawing_soon_expires: (drawing: Drawing) => `Завтра - последний шанс поучаствовать в розыгрыше "${drawing.name}". Успевай принять участие!`,

  // text materials
  text_materials_response: 'У нас есть широкий выбор текстовых материалов: интервью, репортажи, истории групп',
  longreads: 'Лонгриды',
  group_history: 'Истории групп',
  longreads_response: 'Смотри лонгриды тут: https://vk.com/@soundcheck_ural',
  group_history_response: 'Смотри истории групп тут: https://vk.com/soundcheck_ural/music_history',

  // audio_materials
  audio_materials_response: 'Выберите тип аудиоматериалов',
  digests: 'Дайджесты',
  podcasts: 'Подкасты',
  digests_response: 'Смотри дайджесты тут: https://vk.com/soundcheck_ural/audio',
  podcasts_response: 'Смотри подкасты тут:',

  // write to soundcheck
  write_to_soundcheck_response: 'Выберите характер обращения',
  tell_about_group: 'Рассказать о группе',
  tell_about_release: 'Сообщить о релизе',
  collaboration: 'Сотрудничество',
  tell_about_bug: 'Сообщить об ошибке',
  want_to_participate: 'Хочу в Soundcheck!',
  write_to_soundcheck_other: 'Другое',
  tell_about_group_response: 'Напишите о себе пару слов, прикрепляйте ссылки на соцсети',
  tell_about_release_response: 'Прикрепляйте пост, аудиозапись или ссылку и Ваш релиз будет рассмотрен',
  collaboration_response: 'Напишите предложение о сотрудничестве и мы его рассмотрим',
  tell_about_bug_response: 'Опишите ошибку',
  want_to_participate_response: 'Расскажите о себе и чем бы Вы хотели заниматься в Soundcheck',
  write_to_soundcheck_other_response: 'Напишите нам и Вам вскоре ответят',
  tell_about_group_message_response: 'Спасибо за то что рассказали о себе',
  tell_about_release_message_response: 'Релиз принят',
  collaboration_message_response: 'Предложение о сотрудничестве принято',
  tell_about_bug_message_response: 'Спасибо за помощь!',
  want_to_participate_message_response: 'Спасибо за заявку, в ближайшее время с Вами свяжутся',
  write_to_soundcheck_other_message_response: 'Спасибо, Вам в ближайшее время ответят',

  // services
  choose_service: 'Выберите услугу',

  // subscriptions
  subscriptions_response: (user: User) => {
    const subscriptions = _.filter(Subscription, (subscription) => user.subscriptions.includes(subscription));

    return subscriptions.length
      ? `Вы уже подписаны на следующие категории: ${subscriptions.map((subscription) => `"${subscriptionNames[subscription]}"`).join(', ')}. \
Для того, чтобы подписаться или отписаться от категории, нажмите на соответствующую кнопку`
      : 'Для того, чтобы подписаться на категорию, нажмите на соответствующую кнопку';
  },
  subscribe: 'Подписаться',
  unsubscribe: 'Отписаться',
  you_re_already_subscribed: 'Вы уже подписаны',
  subscribe_response: (subscription: Subscription) => `Вы подписались на категорию "${subscriptionNames[subscription]}"`,
  unsubscribe_response: (subscription: Subscription) => `Вы отписались от категории "${subscriptionNames[subscription]}"`,

  // admin
  you_re_not_a_manager: 'Вы не являетесь администратором',
  stats: 'Статистика',
  stats_response: 'Выберите раздел',

  // admin drawings
  add_drawing: 'Добавить розыгрыш',
  choose_or_add_drawing: 'Выберите или добавьте розыгрыш',
  enter_drawing_name: 'Введите название',
  send_drawing_post: 'Отправьте запись с розыгрышем',
  enter_drawing_expires_at: 'Введите дату окончания в формате ДД.ММ (01.12, 23.02, итд)',
  drawing_added: 'Розыгрыш успешно добавлен',
  edit_drawing_name: 'Изменить название',
  edit_drawing_post: 'Изменить пост',
  edit_drawing_expires_at: 'Изменить дату окончания',
  delete_drawing: 'Удалить розыгрыш',
  confirm_drawing_delete: (drawing: Drawing) => `Подтвердите удаление розыгрыша "${drawing.name}"`,
  drawing_edited: 'Розыгрыш сохранен',
  drawing_deleted: 'Розыгрыш удален',

  // admin stats
  clicks: 'Клики',
  group: 'Группа',
  reposts: 'Репосты',
  all_time: 'За все время',
  today: 'Сегодня',
  yesterday: 'Вчера',
  prev_week: 'Прошлая неделя',
  this_month: 'Этот месяц',
  prev_month: 'Прошлый месяц',
  choose_period: 'Выберите период',
  clicks_all: 'Всего',
  no_clicks: 'Кликов не было',
  no_reposts: 'Репостов не было',
  poster_day: 'Афиша (день)',
  poster_choose_day: 'Афиша (выбор дня)',
  poster_week: 'Афиша (неделя)',
  poster_choose_week: 'Афиша (выбор недели)',
  poster_genre: 'Афиша (жанр)',
  poster_genre_type: (genre: Genre) => `Афиша (${genreNames[genre]})`,
  drawing: 'Розыгрыш',
  users_joined: (count: number) => `Вступило в группу: ${count}`,
  users_left: (count: number) => `Вышло из группы: ${count}`,

  // admin send message to users
  send_message_to_users: 'Разослать сообщение',
  choose_group: 'Выберите группу',
  to_all: 'Всем',
  enter_message_text: 'Введите текст сообщения',
  enter_message_post: 'Отправьте запись с розыгрышем (чтобы пропустить, отправьте "нет")',
  enter_message_image: 'Отправьте картинку (чтобы пропустить, отправьте "нет")',
  need_to_refresh_keyboard: 'Надо ли послать обновленную клавиатуру главного меню?',
  message_successfully_sent: 'Сообщение успешно послано',

  // rest
  group_history_message: 'Рассказ о группе',
  release_message: 'Релиз',
  collaboration_message: 'Предложение о сотрудничестве',
  tell_about_bug_message: 'Баг',
  want_to_participate_message: 'Заявка в Soundcheck',
  write_to_soundcheck_other_message: 'Сообщение',
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
  [Genre.POP]: ['электро-поп', 'диско', 'инди-поп', 'синти-поп', 'r\'n\'b', 'соул', 'синт', 'synth', 'акустика'],
  [Genre.FOLK]: ['фолк-рок', 'инди-фолк', 'народная музыка', 'этника', 'этническая музыка'],
  [Genre.ABOUT_MUSIC]: ['лекция', 'выставка', 'кино']
};

export const genresButtons = [
  [Genre.ROCK, Genre.INDIE, Genre.HIP_HOP],
  [Genre.ELECTRONIC, Genre.COVERS, Genre.JAZZ],
  [Genre.POP, Genre.FOLK, Genre.ABOUT_MUSIC],
];

export const positiveAnswers = ['yes', 'да', '+', 'ok', 'ок'];
export const negativeAnswers = ['no', 'нет', '-'];

export const subscriptionNames: Record<Subscription, string> = {
  [Subscription.POSTER]: captions.poster,
  [Subscription.PLAYLISTS]: captions.playlists,
  [Subscription.RELEASES]: captions.releases,
  [Subscription.TEXT_MATERIALS]: captions.text_materials,
  [Subscription.AUDIO_MATERIALS]: captions.audio_materials,
  [Subscription.DRAWINGS]: captions.drawings,
  // [Subscription.SERVICES]: captions.services,
  [Subscription.FOR_MUSICIANS]: captions.for_musicians,
};

export const subscriptionButtons = [
  [Subscription.POSTER, Subscription.PLAYLISTS, Subscription.RELEASES],
  [Subscription.TEXT_MATERIALS, Subscription.AUDIO_MATERIALS],
  [Subscription.DRAWINGS, Subscription.FOR_MUSICIANS],
];

export const subscriptionHashtags: Record<Subscription, string[]> = {
  [Subscription.POSTER]: ['#afisha_week@soundcheck_ural', '#afisha_today@soundcheck_ural', '#anons@soundcheck_ural'],
  [Subscription.PLAYLISTS]: ['#music_selections@soundcheck_ural'],
  [Subscription.RELEASES]: ['#new_release@soundcheck_ural', '#audio@soundcheck_ural'],
  [Subscription.TEXT_MATERIALS]: ['#text@soundcheck_ural'],
  [Subscription.AUDIO_MATERIALS]: ['#audio@soundcheck_ural'],
  [Subscription.DRAWINGS]: ['#prize@soundcheck_ural'],
  // [Subscription.SERVICES]: ['#service@soundcheck_ural'],
  [Subscription.FOR_MUSICIANS]: ['#for_musicians@soundcheck_ural'],
};

export const services: Record<Service, ServiceParams> = {
  stickers_design: {
    name: 'Дизайн стикеров',
    message: '',
    attachments: [{ type: 'market', id: '-177574047_3113786' }]
  },
  soundcheck_ads: {
    name: 'Реклама в Soundcheck',
    message: '',
    attachments: [{ type: 'market', id: '-177574047_2685381' }]
  },
};
