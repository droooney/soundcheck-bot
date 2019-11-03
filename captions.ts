import { Drawing, Genre } from './types';
import { genreNames } from './constants';

export default {
  // main menu
  welcome_text: 'Добро пожаловать в SoundCheck - Музыка Екатеринбурга. Что Вас интересует?',
  main_menu: 'Главное меню',
  poster: 'Афиша',
  playlists: 'Плейлисты',
  releases: 'Релизы',
  drawings: 'Розыгрыши',
  text_materials: 'Статьи',
  audio_materials: 'Аудиоматериалы',
  write_to_soundcheck: 'Написать Soundcheck',
  services: 'Услуги',
  subscriptions: 'Рассылки',
  admin_section: 'Админка',
  refresh_keyboard: '🔄 Обновить клавиатуру',
  choose_action: 'Выберите действие',
  playlists_response: 'Смотри плейлисты тут: https://vk.com/soundcheck_ural/music_selections',
  releases_response: 'Смотри релизы тут: https://vk.com/soundcheck_ural/new_release',
  refresh_keyboard_response: 'Клавиатура обновлена',

  // poster
  day: 'День',
  week: 'Неделя',
  by_genres: 'По жанрам',
  this_week: 'Эта неделя',
  choose_poster_type: 'Выберите тип афиши',
  no_concerts_by_day: 'В ближайшее время концертов нет',
  choose_day: 'Выберите день (выходные отмечены зеленым цветом)',
  choose_week: 'Выберите неделю',
  choose_genre: 'Выберите жанр',
  no_concerts_at_day: 'В этот день концертов нет',
  no_concerts_at_week: 'На эту неделю концертов нет',
  no_concerts_in_genre: (genre: Genre) => (
    genre === Genre.ABOUT_MUSIC
      ? 'В ближайшее время событий на тему музыки нет'
      : `В ближайшее время концертов в жанре "${genreNames[genre]}" нет`
  ),

  // drawings
  choose_drawing: 'Выберите розыгрыш',
  no_drawings: 'В данный момент розыгрышей нет',
  no_drawing: 'Такого розыгрыша не существует, выберите другой',

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
  digests_response: 'Смотри дайджесты тут:',
  podcasts_response: 'Смотри подкасты тут:',

  // write to soundcheck
  write_to_soundcheck_response: 'По поводу?',
  tell_about_group: 'Рассказать о группе',
  tell_about_release: 'Сообщить о релизе',
  collaboration: 'Сотрудничество',
  tell_about_group_response: 'Напишите о себе пару слов, прикрепляйте ссылки на соцсети',
  tell_about_release_response: 'Прикрепляйте пост, аудиозапись или ссылку и Ваш релиз будет рассмотрен',
  collaboration_response: 'Напишите предложение о сотрудничестве и мы его рассмотрим',
  tell_about_group_message_response: 'Спасибо за то что рассказали о себе',
  tell_about_release_message_response: 'Релиз принят',
  collaboration_message_response: 'Предложение о сотрудничестве принято',

  // services
  choose_service: 'Выберите услугу',
  stickers_design: 'Дизайн стикеров',
  soundcheck_ads: 'Реклама в Soundcheck',

  // subscriptions
  subscribe: 'Подписаться',
  you_re_already_subscribed: 'Вы уже подписаны',

  // admin
  you_re_not_a_manager: 'Вы не являетесь администратором',

  // admin drawings
  add_drawing: 'Добавить розыгрыш',
  choose_or_add_drawing: 'Выберите или добавьте розыгрыш',
  enter_drawing_name: 'Введине название',
  send_drawing_post: 'Отправьте запись с розыгрышем',
  drawing_added: 'Розыгрыш успешно добавлен',
  edit_drawing_name: 'Изменить название',
  edit_drawing_post: 'Изменить пост',
  delete_drawing: 'Удалить розыгрыш',
  confirm_drawing_delete: (drawing: Drawing) => `Подтвердите удаление розыгрыша "${drawing.name}"`,
  drawing_edited: 'Розыгрыш сохранен',
  drawing_deleted: 'Розыгрыш удален',

  // rest
  group_history_message: 'Рассказ о группе',
  release_message: 'Релиз',
  collaboration_message: 'Предложение о сотрудничестве',
};
