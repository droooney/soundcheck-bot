import { Genre } from './types';
import { genreNames, RELEASE_HASHTAG, TELL_ABOUT_GROUP_HASHTAG } from './constants';

export default {
  // main menu
  welcome_text: 'Добро пожаловать в SoundCheck - Музыка Екатеринбурга. Что Вас интересует?',
  main_menu: 'Главное меню',
  poster: 'Афиша',
  for_musicians: 'Для музыкантов',
  admin_section: 'Админка',
  playlists: 'Плейлисты',
  releases: 'Релизы',
  text_materials: 'Текстовые материалы',
  drawings: 'Розыгрыши',
  collaboration: 'Сотрудничество',
  refresh_keyboard: '🔄 Обновить клавиатуру',
  choose_action: 'Выберите действие',
  playlists_response: 'Смотри плейлисты тут: https://vk.com/soundcheck_ural/music_selections',
  releases_response: 'Смотри релизы тут: https://vk.com/soundcheck_ural/new_release',
  collaboration_response: 'Пишите Андрею: https://vk.com/im?sel=4046464',
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

  // text materials
  text_materials_response: 'У нас есть широкий выбор текстовых материалов: интервью, репортажи, истории групп',
  longreads: 'Лонгриды',
  group_history: 'Истории групп',
  longreads_response: 'Смотри лонгриды тут: https://vk.com/@soundcheck_ural',
  group_history_response: 'Смотри истории групп тут: https://vk.com/soundcheck_ural/music_history',

  // drawings
  choose_drawing: 'Выберите розыгрыш',
  no_drawings: 'В данный момент розыгрышей нет',
  no_drawing: 'Такого розыгрыша не существует, выберите другой',

  // for musicians
  for_musicians_response: `Если хотите сообщить о новом релизе, напишите сообщение с хэштегом ${RELEASE_HASHTAG}, \
прикрепив пост или аудиозапись. Если хотите рассказать о своей группе, пишите историю группы, \
упомянув хэштег ${TELL_ABOUT_GROUP_HASHTAG}. Также у нас имеются различные услуги для музыкантов.`,
  tell_about_group: 'Рассказать о группе',
  tell_about_release: 'Сообщить о релизе',
  services: 'Услуги',
  tell_about_group_response: `Пишите историю группы, упомянув хэштег ${TELL_ABOUT_GROUP_HASHTAG}`,
  tell_about_release_response: `Напишите сообщение с хэштегом ${RELEASE_HASHTAG}, прикрепив пост или аудиозапись`,
  choose_service: 'Выберите услугу',
  stickers_design: 'Дизайн стикеров',
  soundcheck_ads: 'Реклама в Soundcheck',
  tell_about_group_message_response: 'Рассказ о группе принят',
  tell_about_release_message_response: 'Рассказ о группе',

  // admin
  you_re_not_a_manager: 'Вы не являетесь администратором',
  add_drawing: 'Добавить розыгрыш',
  choose_or_add_drawing: 'Выберите или добавьте розыгрыш',
  enter_drawing_name: 'Введине название',
  enter_drawing_description: 'Введине описание',
  send_drawing_post: 'Отправьте запись с розыгрышем',
  drawing_added: 'Розыгрыш успешно добавлен',

  // rest
  group_history_message: 'Рассказ о группе',
  release_message: 'Релиз',
};
