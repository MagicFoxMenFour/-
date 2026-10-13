import React, { useState } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  MessageSquare,
  Users,
  Bell,
  FileText,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FilmGroup, Participant, Task } from '../types';
import { ROLES } from '../data/roles';

interface VkDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: FilmGroup | null;
  participants: Participant[];
  initialTab?: 'call_sheet' | 'announcement' | 'chat_setup';
  onSaveGroupChatUrl: (groupId: string, url: string) => void;
}

export const VkDispatchModal: React.FC<VkDispatchModalProps> = ({
  isOpen,
  onClose,
  group,
  participants,
  initialTab = 'call_sheet',
  onSaveGroupChatUrl,
}) => {
  const [dispatchType, setDispatchType] = useState<'call_sheet' | 'announcement' | 'chat_setup'>(
    initialTab
  );
  const [copied, setCopied] = useState(false);
  const [copiedIds, setCopiedIds] = useState(false);
  const [chatUrlInput, setChatUrlInput] = useState(group?.vkChatUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Call Sheet State
  const [shiftPreset, setShiftPreset] = useState<'interior' | 'exterior' | 'night' | 'pickup'>('interior');
  const [shiftDate, setShiftDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [shiftNumber, setShiftNumber] = useState('Смена №1');
  const [location, setLocation] = useState('Павильон №2 / Кинозал лаборатории');
  const [callTime, setCallTime] = useState('09:00');
  const [makeupTime, setMakeupTime] = useState('09:30');
  const [firstShotTime, setFirstShotTime] = useState('10:30');
  const [lunchTime, setLunchTime] = useState('14:00 — 15:00');
  const [wrapTime, setWrapTime] = useState('19:30');
  const [notes, setNotes] = useState(
    'Операторскому цеху проверить заряд всех аккумуляторов и чистоту оптики. Звукорежиссёру — провести тест петличек до команды «Мотор».'
  );

  // Announcement State
  const [announcementTitle, setAnnouncementTitle] = useState('Срочное собрание съёмочной группы');
  const [announcementBody, setAnnouncementBody] = useState(
    'Завтра в 12:00 в главной аудитории состоится читка финального драфта сценария с куратором лаборатории. Явка всех ключевых цехов обязательна!'
  );

  if (!isOpen || !group) return null;

  const groupMembers = participants.filter((p) => p.groupId === group.id);

  // Handle preset shifts
  const applyPreset = (preset: 'interior' | 'exterior' | 'night' | 'pickup') => {
    setShiftPreset(preset);
    if (preset === 'interior') {
      setLocation('Павильон №2 / Кинозал лаборатории');
      setCallTime('09:00');
      setMakeupTime('09:30');
      setFirstShotTime('10:30');
      setLunchTime('14:00 — 15:00');
      setWrapTime('19:30');
      setNotes('Интерьерная съёмка. Художнику-постановщику финализировать расстановку реквизита до 09:45.');
    } else if (preset === 'exterior') {
      setLocation('Натурная площадка: старый железнодорожный мост и набережная');
      setCallTime('08:00');
      setMakeupTime('08:45');
      setFirstShotTime('09:30');
      setLunchTime('13:30 — 14:30');
      setWrapTime('18:00');
      setNotes('Натурная съёмка при естественном свете. Форма одежды тёплая и непромокаемая. Взять защиту от ветра для микрофонов.');
    } else if (preset === 'night') {
      setLocation('Пересечение улиц у вокзала / Ночной магазин');
      setCallTime('20:00');
      setMakeupTime('20:45');
      setFirstShotTime('21:30');
      setLunchTime('01:00 — 02:00');
      setWrapTime('05:00');
      setNotes('Ночная смена (low-light). Операторам проверить высокочувствительные светосильные объективы. Продюсеру обеспечить горячий чай.');
    } else if (preset === 'pickup') {
      setLocation('Тон-ателье / Студия звукозаписи и монтажа');
      setCallTime('11:00');
      setMakeupTime('11:30');
      setFirstShotTime('12:00');
      setLunchTime('15:00 — 15:45');
      setWrapTime('18:00');
      setNotes('Досъём деталей и чистовая запись реплик (ADR). Соблюдать абсолютную тишину в аппаратной.');
    }
  };

  // Quick announcement presets
  const applyAnnouncementPreset = (type: 'script' | 'meeting' | 'storyboard' | 'tech' | 'edit') => {
    if (type === 'script') {
      setAnnouncementTitle('Читка и утверждение сценария');
      setAnnouncementBody('Коллеги! Финальный драфт сценария готов. Завтра собираемся на читку с режиссёром и сценаристом, разбираем подтексты сцен и реплики.');
    } else if (type === 'meeting') {
      setAnnouncementTitle('Срочный общий сбор съёмочной группы');
      setAnnouncementBody('Внимание! Произошли изменения в производственном графике. Ждём всех участников группы сегодня в 17:00 в мастерской куратора.');
    } else if (type === 'storyboard') {
      setAnnouncementTitle('Утверждение раскадровок и визуальной экспликации');
      setAnnouncementBody('Оператор-постановщик и художник подготовили черновую раскадровку сцен. Просьба режиссёру и продюсеру согласовать до 19:00.');
    } else if (type === 'tech') {
      setAnnouncementTitle('Технический сбор операторского и звукового цеха');
      setAnnouncementBody('Проводим проверку оборудования, калибровку звуковых рекордеров и тесты оптики. Сбор в 10:00 в аппаратной кинолаборатории.');
    } else if (type === 'edit') {
      setAnnouncementTitle('Дедлайн сдачи чернового монтажа (Assembly cut)');
      setAnnouncementBody('Напоминание режиссёру монтажа: до пятницы 18:00 необходимо загрузить черновую сборку сцен на диск лаборатории для кураторского ревью.');
    }
  };

  // Generate Call Sheet Message
  const generateCallSheetText = () => {
    const lines = [
      `🎬 ВЫЗЫВНОЙ ЛИСТ | ${group.name.toUpperCase()}`,
      `📅 Дата: ${shiftDate} (${shiftNumber})`,
      `📍 Локация: ${location}`,
      ``,
      `⏰ ТАЙМИНГ СМЕНЫ:`,
      `• ${callTime} — Общий сбор группы на площадке`,
      `• ${makeupTime} — Готовность грима, костюма и реквизита`,
      `• ${firstShotTime} — МОТОР! Первый кадр сцены`,
      `• ${lunchTime} — Обед съёмочной смены`,
      `• ${wrapTime} — Окончание смены / Сдача отснятого материала`,
      ``,
      `👥 СОСТАВ СЪЁМОЧНОЙ ГРУППЫ (с упоминанием в беседе):`,
      ...groupMembers.map((m) => {
        const roleDef = ROLES[m.role];
        return `• @${m.vkId} (${m.name}) — ${roleDef?.shortTitle || m.role}`;
      }),
      ``,
      notes ? `ℹ️ ПРИМЕЧАНИЯ И УКАЗАНИЯ ЦЕХАМ:\n${notes}\n` : '',
      `📞 Вопросы по логистике и транспорту: к продюсеру смены.`,
      `— Кинолаборатория 2026`,
    ];
    return lines.filter(Boolean).join('\n');
  };

  // Generate Announcement Message
  const generateAnnouncementText = () => {
    const lines = [
      `📢 КУРАТОРСКОЕ УВЕДОМЛЕНИЕ | ${group.name.toUpperCase()}`,
      ``,
      `📌 ${announcementTitle}:`,
      `${announcementBody}`,
      ``,
      `👥 Участники съёмочной группы:`,
      groupMembers.map((m) => `@${m.vkId} (${m.name.split(' ')[0]})`).join(', '),
      ``,
      `— С уважением, куратор Кинолаборатории`,
    ];
    return lines.join('\n');
  };

  const currentMessageText =
    dispatchType === 'call_sheet'
      ? generateCallSheetText()
      : dispatchType === 'announcement'
      ? generateAnnouncementText()
      : '';

  const handleCopy = () => {
    if (!currentMessageText) return;
    navigator.clipboard.writeText(currentMessageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyVkIds = () => {
    const usernames = groupMembers.map((m) => m.vkId).join(', ');
    navigator.clipboard.writeText(usernames);
    setCopiedIds(true);
    setTimeout(() => setCopiedIds(false), 2500);
  };

  const handleSaveChatUrl = (urlToSave?: string) => {
    const targetUrl = (urlToSave !== undefined ? urlToSave : chatUrlInput).trim();
    onSaveGroupChatUrl(group.id, targetUrl);
    setChatUrlInput(targetUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const generateTemplateChatUrl = () => {
    const generated = `https://vk.me/join/cinelab_group_${group.number}`;
    setChatUrlInput(generated);
    handleSaveChatUrl(generated);
  };

  const targetChatUrl = group.vkChatUrl || 'https://vk.com/im';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shrink-0">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  ВКонтакте (VK): {group.name}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Генерация вызывных листов, оповещений и управление общей беседой группы
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VK Chat Link Notification Bar */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <span className="font-semibold text-zinc-300 shrink-0 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${group.vkChatUrl ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              Беседа группы в VK:
            </span>
            {group.vkChatUrl ? (
              <div className="flex items-center gap-2 truncate">
                <a
                  href={group.vkChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline font-mono truncate max-w-xs flex items-center gap-1"
                >
                  <span className="truncate">{group.vkChatUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <button
                  onClick={() => setDispatchType('chat_setup')}
                  className="text-zinc-400 hover:text-white text-xs underline shrink-0 ml-1"
                >
                  Изменить
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-amber-400/90 text-xs">Ссылка не создана</span>
                <button
                  onClick={() => setDispatchType('chat_setup')}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  + Создать / привязать ссылку
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyVkIds}
              title="Скопировать все VK ID участников группы"
              className="px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs transition-colors flex items-center gap-1 border border-zinc-800"
            >
              {copiedIds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Users className="w-3.5 h-3.5" />}
              <span>{copiedIds ? 'ID скопированы!' : 'Скопировать VK ID участников'}</span>
            </button>

            <a
              href={targetChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>{group.vkChatUrl ? 'Перейти в беседу' : 'Открыть VK'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-4 sm:px-5 pt-3 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDispatchType('call_sheet')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              dispatchType === 'call_sheet'
                ? 'border-white text-white bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Вызывной лист на смену</span>
          </button>

          <button
            onClick={() => setDispatchType('announcement')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              dispatchType === 'announcement'
                ? 'border-white text-white bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Оповещение / Объявление</span>
          </button>

          <button
            onClick={() => setDispatchType('chat_setup')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              dispatchType === 'chat_setup'
                ? 'border-white text-white bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Создание и ссылка на беседу VK</span>
          </button>
        </div>

        {/* Content Body */}
        {dispatchType === 'chat_setup' ? (
          /* Chat Setup Tab */
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 p-4 sm:p-5 rounded-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>Подключение ссылки на общую беседу съёмочной группы в VK</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    После привязки ссылки каждый участник сможет входить в беседу группы из личного кабинета, а куратор — отправлять вызывные листы в один клик.
                  </p>
                </div>
                {group.vkChatUrl && (
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 font-medium shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Беседа активна
                  </span>
                )}
              </div>

              {/* Step by step creation guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 text-xs flex items-center justify-center font-mono">
                      1
                    </span>
                    <span>Скопируйте участников</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Все участники группы ({groupMembers.length} чел.) подготовлены для быстрого добавления в беседу.
                  </p>
                  <button
                    onClick={handleCopyVkIds}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedIds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIds ? 'ID скопированы!' : 'Скопировать VK ID'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 text-xs flex items-center justify-center font-mono">
                      2
                    </span>
                    <span>Создайте беседу в VK</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Откройте VK Messenger, нажмите «Создать беседу» и вставьте скопированные ID участников.
                  </p>
                  <a
                    href="https://vk.com/im"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Открыть VK Мессенджер</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 text-xs flex items-center justify-center font-mono">
                      3
                    </span>
                    <span>Скопируйте ссылку</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    В настройках беседы VK нажмите «Ссылка на беседу» и скопируйте ссылку вида vk.me/join/...
                  </p>
                  <button
                    onClick={generateTemplateChatUrl}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 text-blue-400"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Сгенерировать шаблон</span>
                  </button>
                </div>
              </div>

              {/* URL Input and Save */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Ссылка на общую беседу съёмочной группы:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={chatUrlInput}
                    onChange={(e) => setChatUrlInput(e.target.value)}
                    placeholder="https://vk.me/join/AJQ1d... или ссылка на чат"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    onClick={() => handleSaveChatUrl()}
                    className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl text-xs transition-colors shrink-0 shadow"
                  >
                    {saveSuccess ? 'Сохранено!' : 'Сохранить ссылку'}
                  </button>
                </div>
                {saveSuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ссылка успешно привязана к группе «{group.name}»!</span>
                  </p>
                )}
              </div>
            </div>

            {/* Members VK Directory */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Контакты участников съёмочной группы ({groupMembers.length}):
                </span>
                <span className="text-xs text-zinc-500">
                  Кликните на контакт для перехода в диалог ВКонтакте
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto">
                {groupMembers.map((m) => (
                  <a
                    key={m.id}
                    href={m.vkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">{m.name}</div>
                      <div className="text-zinc-400 text-[11px]">
                        {ROLES[m.role]?.shortTitle || m.role} • @{m.vkId}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Dispatch Tabs (Call Sheet, Announcement, Tasks) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-5 overflow-y-auto flex-1">
            {/* Left Column: Generator Form */}
            <div className="space-y-4">
              {dispatchType === 'call_sheet' && (
                <>
                  {/* Preset Buttons */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Шаблоны съёмочной смены:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPreset('interior')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                          shiftPreset === 'interior'
                            ? 'bg-zinc-800 border-zinc-600 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Павильон
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('exterior')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                          shiftPreset === 'exterior'
                            ? 'bg-zinc-800 border-zinc-600 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Натура
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('night')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                          shiftPreset === 'night'
                            ? 'bg-zinc-800 border-zinc-600 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Ночная
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('pickup')}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                          shiftPreset === 'pickup'
                            ? 'bg-zinc-800 border-zinc-600 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Озвучка/Досъём
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-zinc-300">
                          Дата смены:
                        </label>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setShiftDate(new Date().toISOString().slice(0, 10))}
                            className="text-zinc-400 hover:text-white underline"
                          >
                            Сегодня
                          </button>
                          <span className="text-zinc-600">•</span>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 1);
                              setShiftDate(d.toISOString().slice(0, 10));
                            }}
                            className="text-zinc-400 hover:text-white underline"
                          >
                            Завтра
                          </button>
                        </div>
                      </div>
                      <input
                        type="date"
                        value={shiftDate}
                        onChange={(e) => setShiftDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Номер смены:
                      </label>
                      <input
                        type="text"
                        value={shiftNumber}
                        onChange={(e) => setShiftNumber(e.target.value)}
                        placeholder="Смена №1"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Локация и адрес сбора:
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Павильон, улица, ориентир..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Сбор группы:
                      </label>
                      <input
                        type="text"
                        value={callTime}
                        onChange={(e) => setCallTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Грим/костюм:
                      </label>
                      <input
                        type="text"
                        value={makeupTime}
                        onChange={(e) => setMakeupTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        МОТОР! Кадр 1:
                      </label>
                      <input
                        type="text"
                        value={firstShotTime}
                        onChange={(e) => setFirstShotTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white font-semibold text-amber-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Обед смены:
                      </label>
                      <input
                        type="text"
                        value={lunchTime}
                        onChange={(e) => setLunchTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Окончание смены:
                      </label>
                      <input
                        type="text"
                        value={wrapTime}
                        onChange={(e) => setWrapTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Особые указания цехам:
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Безопасность, проверка звука, аккумуляторы..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </>
              )}

              {dispatchType === 'announcement' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Быстрые темы уведомлений:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyAnnouncementPreset('script')}
                        className="px-2 py-1.5 rounded-lg text-xs bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-left truncate"
                      >
                        📝 Читка сценария
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAnnouncementPreset('meeting')}
                        className="px-2 py-1.5 rounded-lg text-xs bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-left truncate"
                      >
                        🚨 Срочный сбор
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAnnouncementPreset('storyboard')}
                        className="px-2 py-1.5 rounded-lg text-xs bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-left truncate"
                      >
                        🎨 Раскадровки
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAnnouncementPreset('tech')}
                        className="px-2 py-1.5 rounded-lg text-xs bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-left truncate"
                      >
                        ⚙️ Технический сбор
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAnnouncementPreset('edit')}
                        className="px-2 py-1.5 rounded-lg text-xs bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-left truncate col-span-2 sm:col-span-1"
                      >
                        📦 Сдача монтажа
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Тема оповещения:
                    </label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Срочная информация..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Текст сообщения для группы:
                    </label>
                    <textarea
                      rows={6}
                      value={announcementBody}
                      onChange={(e) => setAnnouncementBody(e.target.value)}
                      placeholder="Подробности..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* Direct links to message individual members */}
              <div className="pt-3 border-t border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Написать персонально участнику в диалог VK:
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                  {groupMembers.map((m) => (
                    <a
                      key={m.id}
                      href={`https://vk.me/${m.vkId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
                    >
                      <span className="truncate">{m.name.split(' ')[0]} ({ROLES[m.role]?.shortTitle || m.role})</span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-500 shrink-0 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Live Message Preview in VK format */}
            <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Предпросмотр сообщения для беседы VK:
                </span>
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    copied
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано!' : 'Скопировать'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={currentMessageText}
                rows={16}
                className="w-full flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed resize-none focus:outline-none"
              />

              <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Все участники отмечены через <b className="text-zinc-200">@id</b>. При публикации этого текста в беседу ВКонтакте все участники мгновенно получат push-уведомление!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            Съёмочная группа: <span className="font-semibold text-white">{group.name}</span> ({groupMembers.length} чел.)
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Закрыть
            </button>

            {dispatchType !== 'chat_setup' && (
              <a
                href={targetChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCopy}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Скопировать и перейти в беседу VK</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
