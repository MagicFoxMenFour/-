import { FilmGroup, Participant, Task, MediaAsset, AuditLogEntry } from '../types';
import { generateParticipantPin } from '../services/accessControl';

export const INITIAL_GROUPS: FilmGroup[] = [
  {
    "id": "grp-1",
    "genre": "Комедийная драма / Повседневность",
    "vkChatUrl": "https://vk.me/join/cinelab_group_1",
    "color": "amber",
    "projectTitle": "Общага №4",
    "stage": "pre_production",
    "name": "Группа 1",
    "logline": "Четверо первокурсников с абсолютно полярными характерами заселяются в одну секцию студенческого общежития: бытовые войны за кухню и порядки быстро перерастают в крепкую дружбу и проверку на взрослость.",
    "number": 1
  },
  {
    "id": "grp-2",
    "stage": "pre_production",
    "logline": "Ботаник-перфекционист, харизматичный прогульщик и активистка профкома вынуждены объединиться ради спасения от отчисления на зимней сессии, превращая подготовку к зачётам в череду комичных авантюр.",
    "color": "emerald",
    "number": 2,
    "projectTitle": "Сессия близко",
    "genre": "Ироничное драмеди / Студенческая жизнь",
    "name": "Группа 2",
    "vkChatUrl": "https://vk.me/join/cinelab_group_2"
  },
  {
    "id": "grp-3",
    "projectTitle": "Кампус FM / Третья смена",
    "color": "sky",
    "logline": "Объединенная творческая группа студентов медиацентра и вечернего отделения: переплетение прямых эфиров радиостанции, ночных смен и искренних студенческих историй взросления.",
    "stage": "pre_production",
    "name": "Группа 3 (Объединенная)",
    "number": 3,
    "vkChatUrl": "https://vk.me/join/cinelab_group_3",
    "genre": "Студенческое драмеди / Медиацентр"
  },
  {
    "id": "grp-6",
    "vkChatUrl": "https://vk.me/join/cinelab_group_6",
    "name": "Группа 4 (Параллельные пары)",
    "logline": "Пятеро студентов творческого потока ищут свой авторский голос в профессии и любви, балансируя между строгими требованиями мастеров курса и соблазнами свободной студенческой жизни.",
    "genre": "Лирическое драмеди / Студенческая жизнь",
    "projectTitle": "Параллельные пары",
    "number": 4,
    "color": "cyan",
    "stage": "pre_production"
  },
  {
    "id": "grp-7",
    "color": "#f59e0b",
    "logline": "Производственная съёмочная группа лаборатории под руководством Виолетты Павливской",
    "stage": "production",
    "projectTitle": "Новый проект кинолаборатории",
    "genre": "Драма",
    "number": 5,
    "name": "Группа 5 (Команда Павливской)"
  }
];

const RAW_INITIAL_PARTICIPANTS: Participant[] = [
  {
    "id": "ACT-01",
    "role": "actor",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "vkId": "id507311191",
    "groupId": null,
    "deletedBy": null,
    "preferredWithIds": [],
    "deletedAt": null,
    "name": "Виноградова Лина Валерьевна",
    "skills": [
      "Пою"
    ],
    "pinCode": "4872",
    "deletedReason": null,
    "notes": "",
    "avoidedWithIds": [],
    "vkUrl": "https://vk.com/id507311191",
    "isDeleted": false
  },
  {
    "id": "ACT-02",
    "isDeleted": false,
    "groupId": null,
    "avoidedWithIds": [],
    "preferredWithIds": [],
    "notes": "",
    "name": "Прийма Владислав Андреевич",
    "deletedReason": null,
    "skills": [],
    "deletedAt": null,
    "pinCode": "2488",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null,
    "vkId": "sklizer",
    "vkUrl": "https://vk.com/sklizer",
    "role": "actor"
  },
  {
    "id": "ACT-03",
    "pinCode": "3219",
    "role": "actor",
    "avoidedWithIds": [],
    "vkId": "0leennn",
    "preferredWithIds": [],
    "name": "Гарига Ольга",
    "isDeleted": false,
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "groupId": null,
    "notes": "",
    "deletedBy": null,
    "deletedReason": null,
    "vkUrl": "https://vk.com/0leennn",
    "deletedAt": null,
    "skills": [
      "Жонглирую",
      "Танцую",
      "Шпагат"
    ]
  },
  {
    "id": "ACT-04",
    "pinCode": "3022",
    "role": "actor",
    "vkId": "helga_fov",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "preferredWithIds": [],
    "deletedReason": null,
    "skills": [],
    "name": "Фильчукова Ольга",
    "isDeleted": false,
    "desiredRoles": [
      "actor"
    ],
    "vkUrl": "https://vk.com/helga_fov",
    "avoidedWithIds": [],
    "deletedBy": null,
    "groupId": null,
    "deletedAt": null,
    "notes": ""
  },
  {
    "id": "ACT-05",
    "name": "Климок Владимир Иванович",
    "groupId": null,
    "deletedBy": null,
    "vkUrl": "https://vk.com/hachasak",
    "deletedReason": null,
    "deletedAt": null,
    "notes": "",
    "preferredWithIds": [],
    "role": "actor",
    "vkId": "hachasak",
    "skills": [],
    "pinCode": "7001",
    "avoidedWithIds": [],
    "isDeleted": false,
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  },
  {
    "id": "ACT-06",
    "deletedReason": null,
    "isDeleted": false,
    "avoidedWithIds": [],
    "pinCode": "7282",
    "vkId": "dancha001",
    "role": "actor",
    "notes": "",
    "deletedAt": null,
    "skills": [],
    "groupId": null,
    "vkUrl": "https://vk.com/dancha001",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null,
    "preferredWithIds": [],
    "name": "Чубенко Данил Витальевич"
  },
  {
    "id": "ACT-07",
    "vkId": "id685412466",
    "preferredWithIds": [],
    "avoidedWithIds": [],
    "role": "actor",
    "deletedBy": null,
    "deletedReason": null,
    "deletedAt": null,
    "pinCode": "4785",
    "name": "Глушков Дмитрий Александрович",
    "vkUrl": "https://vk.com/id685412466",
    "skills": [],
    "groupId": null,
    "isDeleted": false,
    "notes": "",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  },
  {
    "id": "ACT-08",
    "skills": [],
    "deletedAt": null,
    "groupId": null,
    "name": "Тимченко Яна Петровна",
    "vkUrl": "https://vk.com/yaninatimchenko",
    "role": "actor",
    "vkId": "yaninatimchenko",
    "notes": "",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null,
    "avoidedWithIds": [],
    "isDeleted": false,
    "pinCode": "3010",
    "preferredWithIds": [],
    "deletedReason": null
  },
  {
    "id": "ACT-09",
    "deletedBy": null,
    "role": "actor",
    "groupId": null,
    "vkId": "uvukitty",
    "deletedAt": null,
    "name": "Букреева Елизавета Витальевна",
    "pinCode": "1658",
    "vkUrl": "https://vk.com/uvukitty",
    "avoidedWithIds": [],
    "deletedReason": null,
    "preferredWithIds": [],
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "skills": [],
    "notes": "",
    "isDeleted": false
  },
  {
    "id": "ACT-10",
    "groupId": null,
    "avoidedWithIds": [],
    "role": "actor",
    "notes": "",
    "vkId": "sunshine859",
    "preferredWithIds": [],
    "vkUrl": "https://vk.com/sunshine859",
    "name": "Ким Ольга Сергеевна",
    "isDeleted": false,
    "deletedBy": null,
    "skills": [],
    "pinCode": "3484",
    "deletedAt": null,
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "deletedReason": null
  },
  {
    "id": "ACT-11",
    "isDeleted": false,
    "skills": [],
    "vkUrl": "https://vk.com/n_sokolov126",
    "avoidedWithIds": [],
    "notes": "",
    "pinCode": "9592",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "preferredWithIds": [],
    "name": "Соколов Николай",
    "deletedReason": null,
    "deletedAt": null,
    "deletedBy": null,
    "groupId": null,
    "role": "actor",
    "vkId": "n_sokolov126"
  },
  {
    "id": "ACT-12",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "notes": "",
    "isDeleted": false,
    "avoidedWithIds": [],
    "vkUrl": "https://vk.com/k_elizaveta_v",
    "pinCode": "9874",
    "skills": [],
    "deletedAt": null,
    "preferredWithIds": [],
    "vkId": "k_elizaveta_v",
    "deletedReason": null,
    "role": "actor",
    "name": "Казачкова Елизавета",
    "deletedBy": null,
    "groupId": null
  },
  {
    "id": "CINE-01",
    "preferredWithIds": [
      "CINE-02",
      "CINE-03"
    ],
    "vkUrl": "https://vk.com/kucayeva_k",
    "name": "Куцаева Кристина",
    "vkId": "kucayeva_k",
    "pinCode": "5136",
    "notes": "Лидер первой группы.",
    "desiredRoles": [
      "director",
      "screenwriter"
    ],
    "role": "director",
    "isDeleted": false,
    "deletedBy": null,
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "avoidedWithIds": [],
    "skills": [],
    "deletedAt": null,
    "groupId": "grp-1"
  },
  {
    "id": "CINE-02",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "avoidedWithIds": [],
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "groupId": null,
    "deletedBy": "Главный продюсер (Куратор)",
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "desiredRoles": [
      "screenwriter",
      "editor"
    ],
    "name": "Вельгоцкая Агния Олеговна",
    "isDeleted": true,
    "role": "screenwriter",
    "pinCode": "6883",
    "vkId": "velgotskaya_a",
    "skills": [],
    "preferredWithIds": [
      "CINE-01"
    ],
    "vkUrl": "https://vk.com/velgotskaya_a"
  },
  {
    "id": "CINE-03",
    "deletedBy": null,
    "groupId": null,
    "desiredRoles": [
      "dop",
      "camera_2"
    ],
    "deletedAt": null,
    "skills": [],
    "avoidedWithIds": [],
    "name": "Ершова Мария Вячеславовна",
    "vkUrl": "https://vk.com/ershova_m",
    "pinCode": "8630",
    "isDeleted": false,
    "preferredWithIds": [
      "CINE-04",
      "CINE-01"
    ],
    "deletedReason": null,
    "vkId": "ershova_m",
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "role": "dop"
  },
  {
    "id": "CINE-04",
    "deletedAt": null,
    "vkUrl": "https://vk.com/arekhovka_s",
    "pinCode": "1377",
    "deletedBy": null,
    "vkId": "arekhovka_s",
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "desiredRoles": [
      "camera_2",
      "dop"
    ],
    "role": "camera_2",
    "preferredWithIds": [
      "CINE-03"
    ],
    "isDeleted": false,
    "groupId": "grp-1",
    "avoidedWithIds": [],
    "name": "Ареховка София Валериевна",
    "skills": []
  },
  {
    "id": "CINE-05",
    "groupId": "grp-1",
    "avoidedWithIds": [],
    "deletedReason": null,
    "preferredWithIds": [
      "CINE-01"
    ],
    "skills": [],
    "isDeleted": false,
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "vkId": "zhigunova_l",
    "deletedBy": null,
    "role": "editor",
    "pinCode": "3124",
    "vkUrl": "https://vk.com/zhigunova_l",
    "desiredRoles": [
      "editor",
      "sound_designer"
    ],
    "deletedAt": null,
    "name": "Жигунова Лаура Эдуардовна"
  },
  {
    "id": "CINE-06",
    "role": "production_designer",
    "isDeleted": false,
    "deletedReason": null,
    "vkId": "abravitaya_b",
    "desiredRoles": [
      "production_designer",
      "makeup_artist"
    ],
    "groupId": "grp-1",
    "vkUrl": "https://vk.com/abravitaya_b",
    "preferredWithIds": [
      "CINE-01"
    ],
    "name": "Абравитая Бенита Александровна",
    "deletedAt": null,
    "skills": [],
    "avoidedWithIds": [],
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null,
    "pinCode": "4871"
  },
  {
    "id": "CINE-07",
    "pinCode": "6618",
    "desiredRoles": [
      "producer"
    ],
    "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    "isDeleted": false,
    "vkUrl": "https://vk.com/ivashuta_m",
    "skills": [],
    "deletedReason": null,
    "deletedAt": null,
    "name": "Ивашута Маргарита Руслановна",
    "groupId": "grp-1",
    "vkId": "ivashuta_m",
    "role": "producer",
    "preferredWithIds": [
      "CINE-01"
    ],
    "deletedBy": null,
    "avoidedWithIds": []
  },
  {
    "id": "CINE-08",
    "deletedBy": null,
    "name": "Ковнер Полина Ивановна",
    "vkUrl": "https://vk.com/kovner_p",
    "role": "sound_designer",
    "vkId": "kovner_p",
    "pinCode": "8365",
    "desiredRoles": [
      "sound_designer",
      "composer"
    ],
    "deletedAt": null,
    "skills": [],
    "preferredWithIds": [
      "CINE-01"
    ],
    "avoidedWithIds": [],
    "isDeleted": false,
    "groupId": "grp-1",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "deletedReason": null
  },
  {
    "id": "CINE-09",
    "pinCode": "1112",
    "role": "makeup_artist",
    "desiredRoles": [
      "makeup_artist",
      "production_designer"
    ],
    "vkId": "donets_a",
    "name": "Донец Алена Владимировна",
    "isDeleted": false,
    "deletedReason": null,
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-06"
    ],
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "groupId": "grp-1",
    "vkUrl": "https://vk.com/donets_a",
    "deletedAt": null,
    "skills": [],
    "avoidedWithIds": []
  },
  {
    "id": "CINE-10",
    "name": "Дудченко Лилия Леонидовна",
    "groupId": "grp-1",
    "desiredRoles": [
      "assistant",
      "director"
    ],
    "vkId": "dudchenko_l",
    "isDeleted": false,
    "role": "assistant",
    "skills": [],
    "vkUrl": "https://vk.com/dudchenko_l",
    "deletedBy": null,
    "pinCode": "2859",
    "deletedAt": null,
    "preferredWithIds": [
      "CINE-01"
    ],
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "avoidedWithIds": []
  },
  {
    "id": "CINE-11",
    "vkId": "goncharova_a",
    "deletedAt": null,
    "vkUrl": "https://vk.com/goncharova_a",
    "role": "director",
    "deletedBy": null,
    "groupId": "grp-2",
    "name": "Гончарова Анна Сергеевна",
    "isDeleted": false,
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "deletedReason": null,
    "preferredWithIds": [
      "CINE-12",
      "CINE-13"
    ],
    "pinCode": "4606",
    "skills": [],
    "avoidedWithIds": []
  },
  {
    "id": "CINE-12",
    "pinCode": "6353",
    "preferredWithIds": [
      "CINE-11"
    ],
    "vkUrl": "https://vk.com/bogodyazh_i",
    "deletedBy": null,
    "deletedAt": null,
    "deletedReason": null,
    "avoidedWithIds": [],
    "name": "Богодяж Илья Сергеевич",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "groupId": "grp-2",
    "skills": [],
    "isDeleted": false,
    "vkId": "bogodyazh_i",
    "role": "screenwriter"
  },
  {
    "id": "CINE-13",
    "vkUrl": "https://vk.com/zhimaev_a",
    "pinCode": "8100",
    "role": "dop",
    "vkId": "zhimaev_a",
    "name": "Жимаев Александр Иванович",
    "isDeleted": false,
    "groupId": "grp-2",
    "skills": [],
    "avoidedWithIds": [],
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-14",
      "CINE-11"
    ],
    "deletedReason": null,
    "deletedAt": null,
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    "id": "CINE-14",
    "pinCode": "9847",
    "name": "Лохвицкая Кристина Руслановна",
    "deletedAt": null,
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "preferredWithIds": [
      "CINE-13"
    ],
    "deletedBy": null,
    "skills": [],
    "role": "camera_2",
    "vkId": "lokhvitskaya_k",
    "deletedReason": null,
    "avoidedWithIds": [],
    "isDeleted": false,
    "groupId": "grp-2",
    "vkUrl": "https://vk.com/lokhvitskaya_k"
  },
  {
    "id": "CINE-15",
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null,
    "groupId": "grp-2",
    "preferredWithIds": [
      "CINE-11"
    ],
    "skills": [],
    "vkUrl": "https://vk.com/baboshina_p",
    "deletedAt": null,
    "pinCode": "2594",
    "name": "Бабошина Полина Александровна",
    "vkId": "baboshina_p",
    "avoidedWithIds": [],
    "isDeleted": false,
    "role": "editor"
  },
  {
    "id": "CINE-16",
    "deletedAt": null,
    "name": "Бричкина Екатерина Олеговна",
    "avoidedWithIds": [],
    "vkId": "brichkina_e",
    "role": "production_designer",
    "groupId": "grp-2",
    "preferredWithIds": [
      "CINE-11"
    ],
    "deletedBy": null,
    "skills": [],
    "isDeleted": false,
    "deletedReason": null,
    "vkUrl": "https://vk.com/brichkina_e",
    "pinCode": "4341",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    "id": "CINE-17",
    "vkId": "aushen_a",
    "deletedAt": null,
    "vkUrl": "https://vk.com/aushen_a",
    "role": "producer",
    "deletedBy": null,
    "groupId": "grp-2",
    "name": "Аушен Адам",
    "isDeleted": false,
    "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "deletedReason": null,
    "preferredWithIds": [
      "CINE-11"
    ],
    "pinCode": "6088",
    "skills": [],
    "avoidedWithIds": []
  },
  {
    "id": "CINE-18",
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "isDeleted": true,
    "avoidedWithIds": [],
    "vkUrl": "https://vk.com/emelina_a",
    "pinCode": "7835",
    "skills": [],
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "preferredWithIds": [
      "CINE-11"
    ],
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "vkId": "emelina_a",
    "role": "sound_designer",
    "name": "Емелина Анисия Романовна",
    "deletedBy": "Главный продюсер (Куратор)",
    "groupId": null
  },
  {
    "id": "CINE-19",
    "role": "makeup_artist",
    "groupId": "grp-2",
    "deletedAt": null,
    "vkId": "aseeva_e",
    "deletedReason": null,
    "skills": [],
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "vkUrl": "https://vk.com/aseeva_e",
    "deletedBy": null,
    "name": "Асеева Екатерина Ивановна",
    "isDeleted": false,
    "pinCode": "9582",
    "preferredWithIds": [
      "CINE-16"
    ],
    "avoidedWithIds": []
  },
  {
    "id": "CINE-20",
    "groupId": "grp-2",
    "name": "Трегуб Ксения Дмитриевна",
    "isDeleted": false,
    "deletedReason": null,
    "preferredWithIds": [
      "CINE-11"
    ],
    "vkId": "tregub_k",
    "role": "assistant",
    "deletedAt": null,
    "skills": [],
    "pinCode": "2329",
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "avoidedWithIds": [],
    "vkUrl": "https://vk.com/tregub_k",
    "deletedBy": null
  },
  {
    "id": "CINE-21",
    "skills": [],
    "preferredWithIds": [
      "CINE-22",
      "CINE-23"
    ],
    "deletedAt": null,
    "pinCode": "4076",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null,
    "name": "Бердиева Зухра Муссаевна",
    "vkUrl": "https://vk.com/berdieva_z",
    "deletedReason": null,
    "isDeleted": false,
    "avoidedWithIds": [],
    "groupId": "grp-3",
    "vkId": "berdieva_z",
    "role": "director"
  },
  {
    "id": "CINE-22",
    "role": "screenwriter",
    "skills": [],
    "avoidedWithIds": [],
    "deletedReason": null,
    "vkId": "gorenkova_v",
    "vkUrl": "https://vk.com/gorenkova_v",
    "name": "Горенкова Вероника Андреевна",
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "isDeleted": false,
    "pinCode": "5823",
    "deletedBy": null,
    "groupId": "grp-3",
    "preferredWithIds": [
      "CINE-21"
    ],
    "deletedAt": null
  },
  {
    "id": "CINE-23",
    "vkId": "zatsepin_s",
    "role": "dop",
    "skills": [],
    "deletedBy": null,
    "avoidedWithIds": [],
    "name": "Зацепин Станислав Александрович",
    "deletedAt": null,
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "pinCode": "7570",
    "preferredWithIds": [
      "CINE-24",
      "CINE-21"
    ],
    "deletedReason": null,
    "vkUrl": "https://vk.com/zatsepin_s",
    "groupId": "grp-7",
    "isDeleted": false
  },
  {
    "id": "CINE-24",
    "pinCode": "9317",
    "deletedBy": "Главный продюсер (Куратор)",
    "name": "Лебедева Анна Александровна",
    "preferredWithIds": [
      "CINE-23"
    ],
    "vkUrl": "https://vk.com/lebedeva_a",
    "vkId": "lebedeva_a",
    "role": "camera_2",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "avoidedWithIds": [],
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "groupId": null,
    "isDeleted": true,
    "skills": []
  },
  {
    "id": "CINE-25",
    "deletedReason": null,
    "vkUrl": "https://vk.com/pechenikina_e",
    "avoidedWithIds": [],
    "isDeleted": false,
    "groupId": "grp-3",
    "preferredWithIds": [
      "CINE-21"
    ],
    "skills": [],
    "deletedBy": null,
    "name": "Печеникина Екатерина Сергеевна",
    "role": "editor",
    "vkId": "pechenikina_e",
    "pinCode": "2064",
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "deletedAt": null
  },
  {
    "id": "CINE-26",
    "skills": [],
    "deletedAt": null,
    "groupId": "grp-3",
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null,
    "vkUrl": "https://vk.com/dusar_k",
    "name": "Дусарь Ксения Андреевна",
    "isDeleted": false,
    "avoidedWithIds": [],
    "deletedReason": null,
    "role": "production_designer",
    "vkId": "dusar_k",
    "pinCode": "3811",
    "preferredWithIds": [
      "CINE-21"
    ]
  },
  {
    "id": "CINE-27",
    "name": "Жужель Ульяна Витальевна",
    "preferredWithIds": [
      "CINE-21"
    ],
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "isDeleted": false,
    "pinCode": "5558",
    "skills": [],
    "role": "producer",
    "vkId": "zhuzhel_u",
    "deletedReason": null,
    "deletedAt": null,
    "avoidedWithIds": [],
    "vkUrl": "https://vk.com/zhuzhel_u",
    "deletedBy": null,
    "groupId": null
  },
  {
    "id": "CINE-28",
    "preferredWithIds": [
      "CINE-21"
    ],
    "name": "Азизова Эмина Рашидовна",
    "isDeleted": false,
    "vkId": "azizova_e",
    "role": "sound_designer",
    "pinCode": "7305",
    "deletedReason": null,
    "skills": [],
    "deletedAt": null,
    "vkUrl": "https://vk.com/azizova_e",
    "avoidedWithIds": [],
    "groupId": "grp-3",
    "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null
  },
  {
    "id": "CINE-29",
    "skills": [],
    "name": "Мартыненко Ксения Александровна",
    "isDeleted": true,
    "vkUrl": "https://vk.com/martynenko_k",
    "avoidedWithIds": [],
    "pinCode": "9052",
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "role": "makeup_artist",
    "vkId": "martynenko_k",
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "preferredWithIds": [
      "CINE-26"
    ],
    "groupId": null,
    "deletedBy": "Главный продюсер (Куратор)"
  },
  {
    "id": "CINE-30",
    "pinCode": "1799",
    "preferredWithIds": [
      "CINE-21"
    ],
    "role": "assistant",
    "vkId": "korkmazova_k",
    "name": "Коркмазова Камила",
    "isDeleted": false,
    "vkUrl": "https://vk.com/korkmazova_k",
    "deletedBy": null,
    "groupId": null,
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "deletedAt": null,
    "skills": [],
    "avoidedWithIds": []
  },
  {
    "id": "CINE-31",
    "groupId": "grp-7",
    "vkId": "pavlivskaya_v",
    "deletedReason": null,
    "role": "director",
    "deletedAt": null,
    "name": "Павливская Виолетта Сергеевна",
    "deletedBy": null,
    "vkUrl": "https://vk.com/pavlivskaya_v",
    "skills": [],
    "isDeleted": false,
    "avoidedWithIds": [],
    "pinCode": "3546",
    "preferredWithIds": [
      "CINE-32",
      "CINE-33"
    ],
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  },
  {
    "id": "CINE-32",
    "skills": [],
    "pinCode": "5293",
    "isDeleted": false,
    "preferredWithIds": [
      "CINE-31"
    ],
    "avoidedWithIds": [],
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "vkId": "eremkin_m",
    "role": "screenwriter",
    "groupId": "grp-7",
    "vkUrl": "https://vk.com/eremkin_m",
    "deletedAt": null,
    "deletedReason": null,
    "name": "Еремкин Максим Александрович",
    "deletedBy": null
  },
  {
    "id": "CINE-33",
    "role": "dop",
    "vkId": "ovcharov_n",
    "groupId": null,
    "avoidedWithIds": [],
    "isDeleted": true,
    "skills": [],
    "vkUrl": "https://vk.com/ovcharov_n",
    "preferredWithIds": [
      "CINE-34",
      "CINE-31"
    ],
    "name": "Овчаров Никита Владимирович",
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "pinCode": "7040",
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "deletedBy": "Главный продюсер (Куратор)"
  },
  {
    "id": "CINE-34",
    "skills": [],
    "name": "Черкасова Анастасия",
    "preferredWithIds": [
      "CINE-33"
    ],
    "vkUrl": "https://vk.com/cherkasova_a",
    "deletedReason": null,
    "deletedBy": null,
    "deletedAt": null,
    "groupId": "grp-3",
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "role": "dop",
    "vkId": "cherkasova_a",
    "avoidedWithIds": [],
    "pinCode": "8787",
    "isDeleted": false
  },
  {
    "id": "CINE-35",
    "vkId": "arbulyak_v",
    "groupId": null,
    "role": "editor",
    "skills": [],
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "deletedBy": "Главный продюсер (Куратор)",
    "avoidedWithIds": [],
    "name": "Арбуляк Виктория Ивановна",
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "isDeleted": true,
    "vkUrl": "https://vk.com/arbulyak_v",
    "pinCode": "1534",
    "preferredWithIds": [
      "CINE-31"
    ],
    "deletedReason": "Отмечен как уходит/не появился по списку куратора"
  },
  {
    "id": "CINE-36",
    "preferredWithIds": [
      "CINE-31"
    ],
    "groupId": null,
    "isDeleted": true,
    "avoidedWithIds": [],
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "deletedBy": "Главный продюсер (Куратор)",
    "name": "Захарова Анастасия Вадимовна",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "role": "production_designer",
    "pinCode": "3281",
    "vkId": "zakharova_a",
    "skills": [],
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "vkUrl": "https://vk.com/zakharova_a"
  },
  {
    "id": "CINE-37",
    "role": "producer",
    "vkId": "bardakov_a",
    "vkUrl": "https://vk.com/bardakov_a",
    "deletedReason": null,
    "isDeleted": false,
    "groupId": "grp-3",
    "name": "Бардаков Андрей Владимирович",
    "skills": [],
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-31"
    ],
    "avoidedWithIds": [],
    "pinCode": "5028",
    "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "deletedAt": null
  },
  {
    "id": "CINE-38",
    "vkUrl": "https://vk.com/mastyugin_n",
    "pinCode": "6775",
    "avoidedWithIds": [],
    "isDeleted": true,
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "preferredWithIds": [
      "CINE-31"
    ],
    "deletedBy": "Главный продюсер (Куратор)",
    "vkId": "mastyugin_n",
    "role": "sound_designer",
    "groupId": null,
    "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "skills": [],
    "name": "Мастюгин Никита Владимирович"
  },
  {
    "id": "CINE-39",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "isDeleted": false,
    "pinCode": "8522",
    "skills": [],
    "name": "Рябцева Мария Андреевна",
    "deletedReason": null,
    "deletedAt": null,
    "deletedBy": null,
    "avoidedWithIds": [],
    "preferredWithIds": [
      "CINE-40",
      "CINE-31"
    ],
    "groupId": null,
    "role": "assistant",
    "vkUrl": "https://vk.com/ryabtseva_m",
    "vkId": "ryabtseva_m"
  },
  {
    "id": "CINE-40",
    "skills": [],
    "name": "Зозуля Анастасия Андреевна",
    "isDeleted": true,
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "groupId": null,
    "vkId": "zozulya_a",
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "role": "assistant",
    "preferredWithIds": [
      "CINE-39"
    ],
    "vkUrl": "https://vk.com/zozulya_a",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "deletedBy": "Главный продюсер (Куратор)",
    "avoidedWithIds": [],
    "pinCode": "1269"
  },
  {
    "id": "CINE-41",
    "deletedReason": null,
    "isDeleted": false,
    "avoidedWithIds": [],
    "vkUrl": "https://vk.com/sokhrokov_k",
    "pinCode": "3016",
    "vkId": "sokhrokov_k",
    "deletedAt": null,
    "preferredWithIds": [
      "CINE-42",
      "CINE-43"
    ],
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "role": "assistant",
    "groupId": "grp-7",
    "name": "Сохроков Константин Артурович",
    "deletedBy": null,
    "skills": []
  },
  {
    "id": "CINE-42",
    "vkId": "ryzhonkova_m",
    "role": "screenwriter",
    "deletedAt": null,
    "deletedReason": null,
    "pinCode": "4763",
    "name": "Рыжонкова Мария Александровна",
    "deletedBy": null,
    "isDeleted": false,
    "skills": [],
    "groupId": "grp-3",
    "preferredWithIds": [
      "CINE-41"
    ],
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "vkUrl": "https://vk.com/ryzhonkova_m",
    "avoidedWithIds": []
  },
  {
    "id": "CINE-43",
    "vkId": "fedorova_a",
    "role": "camera_2",
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-44",
      "CINE-41"
    ],
    "groupId": "grp-3",
    "deletedReason": null,
    "avoidedWithIds": [],
    "name": "Федорова Арина Романовна",
    "deletedAt": null,
    "skills": [],
    "vkUrl": "https://vk.com/fedorova_a",
    "isDeleted": false,
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "pinCode": "6510"
  },
  {
    "id": "CINE-44",
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "pinCode": "8257",
    "deletedReason": null,
    "skills": [],
    "isDeleted": false,
    "name": "Милославская Яна Аркадьевна",
    "deletedBy": null,
    "groupId": "grp-7",
    "deletedAt": null,
    "role": "camera_2",
    "vkId": "miloslavskaya_y",
    "avoidedWithIds": [],
    "preferredWithIds": [
      "CINE-43"
    ],
    "vkUrl": "https://vk.com/miloslavskaya_y"
  },
  {
    "id": "CINE-45",
    "role": "editor",
    "vkId": "kupchinskiy_m",
    "vkUrl": "https://vk.com/kupchinskiy_m",
    "deletedReason": null,
    "isDeleted": false,
    "groupId": "grp-7",
    "name": "Купчинский Максим Александрович",
    "skills": [],
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-41"
    ],
    "avoidedWithIds": [],
    "pinCode": "1004",
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "deletedAt": null
  },
  {
    "id": "CINE-46",
    "deletedBy": "Главный продюсер (Куратор)",
    "preferredWithIds": [
      "CINE-41"
    ],
    "pinCode": "2751",
    "vkId": "sandalova_e",
    "role": "production_designer",
    "vkUrl": "https://vk.com/sandalova_e",
    "avoidedWithIds": [],
    "name": "Сандалова Елизавета Олеговна",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "groupId": null,
    "isDeleted": true,
    "skills": [],
    "deletedReason": "Отмечен как уходит/не появился по списку куратора"
  },
  {
    "id": "CINE-47",
    "groupId": null,
    "preferredWithIds": [
      "CINE-41"
    ],
    "skills": [],
    "name": "Сергеев Егор Сергеевич",
    "deletedBy": null,
    "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "role": "producer",
    "deletedAt": null,
    "vkId": "sergeev_e",
    "avoidedWithIds": [],
    "vkUrl": "https://vk.com/sergeev_e",
    "deletedReason": null,
    "pinCode": "4498",
    "isDeleted": false
  },
  {
    "id": "CINE-48",
    "deletedReason": null,
    "preferredWithIds": [
      "CINE-49",
      "CINE-41"
    ],
    "deletedBy": null,
    "skills": [],
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "pinCode": "6245",
    "deletedAt": null,
    "name": "Прозорова Мария Александровна",
    "groupId": null,
    "avoidedWithIds": [],
    "isDeleted": false,
    "vkUrl": "https://vk.com/prozorova_m",
    "vkId": "prozorova_m",
    "role": "sound_designer"
  },
  {
    "id": "CINE-49",
    "deletedReason": null,
    "isDeleted": false,
    "vkUrl": "https://vk.com/agafonova_e",
    "preferredWithIds": [
      "CINE-48",
      "CINE-41"
    ],
    "pinCode": "7992",
    "avoidedWithIds": [],
    "skills": [],
    "name": "Агафонова Эвелина Евгеньевна",
    "deletedAt": null,
    "role": "composer",
    "deletedBy": null,
    "vkId": "agafonova_e",
    "groupId": null,
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    "id": "CINE-50",
    "name": "Бескровный Артём",
    "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    "role": "assistant",
    "skills": [],
    "groupId": "grp-7",
    "vkId": "beskrovny_a",
    "isDeleted": false,
    "avoidedWithIds": [],
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-41"
    ],
    "deletedAt": null,
    "pinCode": "9739",
    "deletedReason": null,
    "vkUrl": "https://vk.com/beskrovny_a"
  },
  {
    "id": "CINE-51",
    "preferredWithIds": [
      "CINE-52",
      "CINE-53"
    ],
    "vkUrl": "https://vk.com/tislenko_v",
    "name": "Тисленко Вероника Алексеевна",
    "pinCode": "2486",
    "vkId": "tislenko_v",
    "role": "director",
    "isDeleted": false,
    "deletedBy": null,
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "avoidedWithIds": [],
    "skills": [],
    "deletedAt": null,
    "groupId": "grp-6"
  },
  {
    "id": "CINE-52",
    "skills": [],
    "groupId": "grp-6",
    "isDeleted": false,
    "vkUrl": "https://vk.com/sveredyuk_y",
    "preferredWithIds": [
      "CINE-51"
    ],
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "deletedAt": null,
    "pinCode": "4233",
    "name": "Свередюк Ярослав Павлович",
    "deletedReason": null,
    "role": "screenwriter",
    "vkId": "sveredyuk_y",
    "avoidedWithIds": [],
    "deletedBy": null
  },
  {
    "id": "CINE-53",
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "pinCode": "5980",
    "skills": [],
    "isDeleted": false,
    "name": "Фурсов Илья Сергеевич",
    "vkUrl": "https://vk.com/fursov_i",
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-54",
      "CINE-51"
    ],
    "deletedReason": null,
    "deletedAt": null,
    "avoidedWithIds": [],
    "role": "dop",
    "groupId": "grp-6",
    "vkId": "fursov_i"
  },
  {
    "id": "CINE-54",
    "groupId": "grp-6",
    "isDeleted": false,
    "deletedReason": null,
    "avoidedWithIds": [],
    "preferredWithIds": [
      "CINE-53"
    ],
    "vkId": "spiridonenko_v",
    "skills": [],
    "role": "camera_2",
    "deletedAt": null,
    "pinCode": "7727",
    "vkUrl": "https://vk.com/spiridonenko_v",
    "name": "Спиридоненко Виктория Ивановна",
    "deletedBy": null,
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
  },
  {
    "id": "CINE-55",
    "deletedBy": null,
    "role": "editor",
    "preferredWithIds": [
      "CINE-51"
    ],
    "skills": [],
    "vkId": "kuchevskaya_m",
    "groupId": "grp-6",
    "vkUrl": "https://vk.com/kuchevskaya_m",
    "name": "Кучевская Маргарита Дмитриевна",
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "deletedAt": null,
    "deletedReason": null,
    "isDeleted": false,
    "avoidedWithIds": [],
    "pinCode": "9474"
  },
  {
    "id": "CINE-56",
    "deletedBy": null,
    "role": "production_designer",
    "vkId": "kokareva_p",
    "groupId": "grp-7",
    "deletedAt": null,
    "name": "Кокарева Полина Евгеньевна",
    "pinCode": "2221",
    "vkUrl": "https://vk.com/kokareva_p",
    "avoidedWithIds": [],
    "deletedReason": null,
    "preferredWithIds": [
      "CINE-51"
    ],
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "skills": [],
    "isDeleted": false
  },
  {
    "id": "CINE-57",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "avoidedWithIds": [],
    "deletedReason": null,
    "isDeleted": false,
    "skills": [],
    "vkUrl": "https://vk.com/stefanova_m",
    "groupId": "grp-6",
    "deletedBy": null,
    "name": "Стефанова Мария Валерьевна",
    "preferredWithIds": [
      "CINE-51"
    ],
    "pinCode": "3968",
    "vkId": "stefanova_m",
    "deletedAt": null,
    "role": "producer"
  },
  {
    "id": "CINE-58",
    "skills": [],
    "deletedBy": "Главный продюсер (Куратор)",
    "pinCode": "5715",
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "avoidedWithIds": [],
    "vkUrl": "https://vk.com/pustovetov_a",
    "groupId": null,
    "name": "Пустоветов Александр Геннадьевич",
    "role": "sound_designer",
    "vkId": "pustovetov_a",
    "isDeleted": true,
    "preferredWithIds": [
      "CINE-51"
    ]
  },
  {
    "id": "CINE-59",
    "groupId": "grp-6",
    "vkId": "fedyakova_a",
    "role": "makeup_artist",
    "deletedAt": null,
    "skills": [],
    "avoidedWithIds": [],
    "deletedBy": null,
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "name": "Федякова Алена Олеговна",
    "isDeleted": false,
    "deletedReason": null,
    "pinCode": "7462",
    "preferredWithIds": [
      "CINE-56"
    ],
    "vkUrl": "https://vk.com/fedyakova_a"
  },
  {
    "id": "CINE-60",
    "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    "pinCode": "9209",
    "deletedReason": null,
    "name": "Пономарёва Алёна Викторовна",
    "role": "assistant",
    "avoidedWithIds": [],
    "vkId": "ponomareva_a",
    "isDeleted": false,
    "skills": [],
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-51"
    ],
    "groupId": null,
    "deletedAt": null,
    "vkUrl": "https://vk.com/ponomareva_a"
  },
  {
    "id": "CINE-61",
    "deletedBy": null,
    "vkUrl": "https://vk.com/chaplygina_s",
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "pinCode": "1956",
    "skills": [],
    "avoidedWithIds": [],
    "deletedAt": null,
    "name": "Чаплыгина София Олеговна",
    "isDeleted": false,
    "vkId": "chaplygina_s",
    "preferredWithIds": [
      "CINE-70",
      "CINE-62"
    ],
    "role": "director",
    "groupId": null
  },
  {
    "id": "CINE-62",
    "pinCode": "3703",
    "role": "screenwriter",
    "vkId": "khugaev_a",
    "isDeleted": true,
    "name": "Хугаев Ацамаз Асламбекович",
    "deletedReason": "Отмечен как уходит/не появился по списку куратора",
    "deletedBy": "Главный продюсер (Куратор)",
    "preferredWithIds": [
      "CINE-61"
    ],
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "groupId": null,
    "vkUrl": "https://vk.com/khugaev_a",
    "deletedAt": "2026-10-20T11:07:14.205Z",
    "skills": [],
    "avoidedWithIds": []
  },
  {
    "id": "CINE-63",
    "preferredWithIds": [
      "CINE-64",
      "CINE-61"
    ],
    "role": "dop",
    "groupId": null,
    "deletedBy": null,
    "vkId": "demyanova_a",
    "deletedAt": null,
    "name": "Демьянова Алина Андреевна",
    "avoidedWithIds": [],
    "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "pinCode": "5450",
    "deletedReason": null,
    "vkUrl": "https://vk.com/demyanova_a",
    "isDeleted": false,
    "skills": []
  },
  {
    "id": "CINE-64",
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "avoidedWithIds": [],
    "deletedReason": null,
    "isDeleted": false,
    "skills": [],
    "vkUrl": "https://vk.com/cheremisova_m",
    "groupId": null,
    "name": "Черемисова Мария Нуровна",
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-63"
    ],
    "pinCode": "7197",
    "vkId": "cheremisova_m",
    "deletedAt": null,
    "role": "camera_2"
  },
  {
    "id": "CINE-65",
    "skills": [],
    "name": "Салтанова Ангелина Стасовна",
    "pinCode": "8944",
    "preferredWithIds": [
      "CINE-61"
    ],
    "role": "editor",
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "isDeleted": false,
    "vkId": "saltanova_a",
    "vkUrl": "https://vk.com/saltanova_a",
    "groupId": null,
    "deletedReason": null,
    "deletedBy": null,
    "avoidedWithIds": [],
    "deletedAt": null
  },
  {
    "id": "CINE-66",
    "isDeleted": false,
    "avoidedWithIds": [],
    "skills": [],
    "vkUrl": "https://vk.com/trushova_a",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "preferredWithIds": [
      "CINE-61"
    ],
    "pinCode": "1691",
    "deletedReason": null,
    "role": "producer",
    "vkId": "trushova_a",
    "deletedAt": null,
    "name": "Трушова Александра Николаевна",
    "groupId": "grp-7",
    "deletedBy": null
  },
  {
    "id": "CINE-67",
    "deletedBy": null,
    "role": "producer",
    "vkId": "bilous_e",
    "groupId": null,
    "name": "Билоус Елизавета Константиновна",
    "deletedAt": null,
    "avoidedWithIds": [],
    "deletedReason": null,
    "vkUrl": "https://vk.com/bilous_e",
    "preferredWithIds": [
      "CINE-61"
    ],
    "pinCode": "3438",
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "isDeleted": false,
    "skills": []
  },
  {
    "id": "CINE-68",
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "role": "sound_designer",
    "vkId": "shelamov_a",
    "deletedAt": null,
    "name": "Шеламов Артём Александрович",
    "deletedBy": null,
    "groupId": null,
    "skills": [],
    "avoidedWithIds": [],
    "isDeleted": false,
    "preferredWithIds": [
      "CINE-61"
    ],
    "vkUrl": "https://vk.com/shelamov_a",
    "pinCode": "5185"
  },
  {
    "id": "CINE-69",
    "name": "Аушев Абдаллах",
    "deletedBy": null,
    "role": "assistant",
    "vkId": "aushev_ab",
    "deletedAt": null,
    "groupId": null,
    "preferredWithIds": [
      "CINE-61"
    ],
    "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "deletedReason": null,
    "vkUrl": "https://vk.com/aushev_ab",
    "pinCode": "6932",
    "skills": [],
    "avoidedWithIds": [],
    "isDeleted": false
  },
  {
    "id": "CINE-70",
    "vkId": "chaplygina_albina",
    "role": "assistant",
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-61"
    ],
    "groupId": null,
    "deletedReason": null,
    "avoidedWithIds": [],
    "name": "Чаплыгина Альбина Анатольевна",
    "deletedAt": null,
    "skills": [],
    "isDeleted": false,
    "vkUrl": "https://vk.com/chaplygina_albina",
    "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    "pinCode": "8679"
  },
  {
    "id": "CINE-71",
    "pinCode": "1426",
    "deletedBy": null,
    "avoidedWithIds": [],
    "name": "Никита Савельев",
    "vkUrl": "https://vk.com/savelev_n",
    "notes": "Готов на замену или усиление операторского департамента.",
    "preferredWithIds": [
      "CINE-01",
      "CINE-11"
    ],
    "deletedAt": null,
    "vkId": "savelev_n",
    "role": "dop",
    "deletedReason": null,
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "groupId": null,
    "skills": [],
    "isDeleted": false
  },
  {
    "id": "CINE-72",
    "deletedReason": null,
    "vkUrl": "https://vk.com/klimova_m",
    "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "deletedBy": null,
    "preferredWithIds": [
      "CINE-31"
    ],
    "skills": [],
    "pinCode": "3173",
    "deletedAt": null,
    "name": "Мария Климова",
    "avoidedWithIds": [],
    "vkId": "klimova_m",
    "role": "producer",
    "groupId": null,
    "isDeleted": false
  },
  {
    "id": "CINE-73",
    "deletedAt": null,
    "groupId": null,
    "vkId": "volkov_s",
    "role": "editor",
    "name": "Станислав Волков",
    "deletedBy": null,
    "deletedReason": null,
    "vkUrl": "https://vk.com/volkov_s",
    "avoidedWithIds": [],
    "preferredWithIds": [
      "CINE-61"
    ],
    "skills": [],
    "isDeleted": false,
    "pinCode": "4920",
    "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
  },
  {
    "id": "CINE-74",
    "vkUrl": "https://vk.com/belyaeva_kr",
    "skills": [],
    "deletedBy": null,
    "role": "actor",
    "vkId": "belyaeva_kr",
    "avoidedWithIds": [],
    "name": "Кристина Беляева",
    "deletedAt": null,
    "pinCode": "6667",
    "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "preferredWithIds": [
      "CINE-41"
    ],
    "groupId": null,
    "deletedReason": null,
    "isDeleted": false
  },
  {
    "id": "CINE-75",
    "vkId": "id589724412",
    "preferredWithIds": [
      "CINE-01",
      "CINE-05",
      "CINE-06",
      "CINE-07",
      "CINE-09",
      "CINE-10",
      "CINE-04"
    ],
    "role": "screenwriter",
    "notes": "",
    "isDeleted": false,
    "vkUrl": "https://vk.com/id589724412",
    "groupId": null,
    "desiredRoles": [
      "actor",
      "screenwriter"
    ],
    "name": "Балян Роман Вагеевич",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "deletedAt": null,
    "avoidedWithIds": [],
    "deletedReason": null,
    "pinCode": "9954",
    "deletedBy": null,
    "skills": []
  },
  {
    "id": "CINE-76",
    "isDeleted": false,
    "vkId": "morozzushhka",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "role": "actor",
    "groupId": null,
    "notes": "",
    "vkUrl": "https://vk.com/morozzushhka",
    "deletedReason": null,
    "avoidedWithIds": [],
    "skills": [
      "Гитара",
      "Фортепиано",
      "Барабаны",
      "Пою",
      "Проф. Танцы",
      "Акробатика",
      "Жестовый язык"
    ],
    "name": "Мороз Злата Александровна",
    "preferredWithIds": [],
    "pinCode": "4801",
    "deletedAt": null,
    "deletedBy": null
  },
  {
    "id": "CINE-77",
    "deletedBy": null,
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "pinCode": "7369",
    "notes": "",
    "preferredWithIds": [],
    "deletedAt": null,
    "skills": [],
    "vkUrl": "https://vk.com/roooiis",
    "avoidedWithIds": [],
    "groupId": "grp-7",
    "name": "Рустамов Тимур Рамизович",
    "vkId": "roooiis",
    "deletedReason": null,
    "isDeleted": false,
    "role": "sound_designer"
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = RAW_INITIAL_PARTICIPANTS.map((p, idx) => ({
  ...p,
  pinCode: p.pinCode || generateParticipantPin(p.id, idx),
}));

export const COMMON_STUDENT_SERIES_TASK = "Ваша задача — разработать и подготовить пилотную серию предполагаемого сериала о студентах.\n\nСериал строится вокруг постоянных героев с разными характерами и психотипами, которые учатся и общаются в одной студенческой среде. В каждой серии могут возникать новые ситуации, конфликты, отношения и комедийные или драматические истории, при этом персонажи и их взаимоотношения постепенно развиваются.\n\nПилотная серия должна:\n• познакомить зрителя с миром сериала;\n• представить основных персонажей;\n• показать их характеры и отношения;\n• создать первый конфликт или ситуацию;\n• заинтересовать продолжением;\n• продемонстрировать, какие истории можно рассказывать в следующих сериях.\n\nИтог: готовая пилотная серия, которая одновременно работает как самостоятельная история и показывает потенциал будущего сериала.";

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_MEDIA_ASSETS: MediaAsset[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-10T10:00:00Z',
    actorName: 'Главный продюсер',
    actorRole: 'admin',
    actionType: 'group_change',
    targetTitle: 'Съёмочные группы №1–№7',
    details: 'Инициализация 7 съёмочных групп и установка производственных фаз.',
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-10T11:15:00Z',
    actorName: 'Куратор лаборатории',
    actorRole: 'admin',
    actionType: 'media_change',
    targetTitle: 'Общий регламент кинолаборатории',
    details: 'Загружен официальный регламент и шаблон вызывного листа.',
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-10T14:30:00Z',
    actorName: 'Продюсер лаборатории',
    actorRole: 'admin',
    actionType: 'stop_list_change',
    targetTitle: 'Стоп-листы лаборатории',
    details: 'Проверка взаимных ограничений: стоп-листы согласованы, 0 активных несовместимостей.',
  },
];

