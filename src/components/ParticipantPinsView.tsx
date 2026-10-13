import React, { useState, useMemo } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Search,
  Download,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Edit2,
  Lock,
  X,
  Users,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { FilmGroup, Participant } from '../types';
import { ROLES } from '../data/roles';
import { generateRandomPin } from '../services/accessControl';

interface ParticipantPinsViewProps {
  participants: Participant[];
  groups: FilmGroup[];
  onUpdateParticipantPin: (participantId: string, newPin: string) => void;
  onSelectMemberForCabinet: (member: Participant) => void;
}

export const ParticipantPinsView: React.FC<ParticipantPinsViewProps> = ({
  participants,
  groups,
  onUpdateParticipantPin,
  onSelectMemberForCabinet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [showAllPins, setShowAllPins] = useState(true);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);

  // Edit Single PIN Modal
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [manualPinInput, setManualPinInput] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Batch regenerate confirm
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);

  // Toggle individual PIN visibility
  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesId = p.id.toLowerCase().includes(query);
        const matchesVk = p.vkId.toLowerCase().includes(query);
        const matchesRole = (ROLES[p.role]?.title || p.role).toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesVk && !matchesRole) {
          return false;
        }
      }

      // Group filter
      if (selectedGroupFilter !== 'all') {
        if (selectedGroupFilter === 'bench') {
          if (p.groupId !== null) return false;
        } else {
          if (p.groupId !== selectedGroupFilter) return false;
        }
      }

      // Role filter
      if (selectedRoleFilter !== 'all') {
        if (p.role !== selectedRoleFilter) return false;
      }

      return true;
    });
  }, [participants, searchQuery, selectedGroupFilter, selectedRoleFilter]);

  // Copy just PIN
  const handleCopyPin = (participant: Participant) => {
    const pin = participant.pinCode || '----';
    navigator.clipboard.writeText(pin);
    setCopiedId(participant.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === participant.id ? null : prev));
    }, 2000);
  };

  // Copy VK invite message
  const handleCopyVkInvite = (participant: Participant) => {
    const pin = participant.pinCode || '----';
    const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const portalUrl = `${currentUrl}?member=${participant.id}`;
    const roleTitle = ROLES[participant.role]?.title || participant.role;
    const group = groups.find((g) => g.id === participant.groupId);
    const groupTitle = group ? group.name : 'Резерв цеха';

    const message = `🎬 Привет, ${participant.name}!\n\nТвоя роль в Кинолаборатории: ${roleTitle}\nСъёмочная группа: ${groupTitle}\n\n🔑 Твой персональный 4-значный PIN-код для входа в личный кабинет: ${pin}\n\nСсылка на личный кабинет:\n${portalUrl}\n\n(В кабинете можно смотреть съёмочный план, памятки цеха, прикреплять материалы и при необходимости сменить свой PIN).`;

    navigator.clipboard.writeText(message);
    setCopiedInviteId(participant.id);
    setTimeout(() => {
      setCopiedInviteId((prev) => (prev === participant.id ? null : prev));
    }, 2500);
  };

  // Generate random PIN for participant
  const handleRegeneratePin = (participant: Participant) => {
    const fresh = generateRandomPin();
    onUpdateParticipantPin(participant.id, fresh);
    setCopiedId(participant.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === participant.id ? null : prev));
    }, 1500);
  };

  // Open manual edit modal
  const handleOpenEditModal = (participant: Participant) => {
    setEditingParticipant(participant);
    setManualPinInput(participant.pinCode || '');
    setEditError(null);
  };

  const handleSaveManualPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    const clean = manualPinInput.trim();
    if (clean.length !== 4 || !/^\d{4}$/.test(clean)) {
      setEditError('PIN-код должен состоять ровно из 4 цифр (например, 7482)');
      return;
    }
    if (clean === '1234') {
      setEditError('Использование кода 1234 запрещено политикой безопасности');
      return;
    }
    onUpdateParticipantPin(editingParticipant.id, clean);
    setEditingParticipant(null);
  };

  // Copy all PINs as list
  const handleCopyAll = () => {
    const lines = [
      '===========================================================',
      'КИНОЛАБОРАТОРИЯ — ВЕДОМОСТЬ ПЕРСОНАЛЬНЫХ PIN-КОДОВ ДОСТУПА',
      `Всего участников: ${participants.length}`,
      '===========================================================',
      '',
    ];

    groups.forEach((g) => {
      const gMembers = participants.filter((p) => p.groupId === g.id);
      if (gMembers.length > 0) {
        lines.push(`--- ${g.name} ---`);
        gMembers.forEach((p) => {
          const roleTitle = ROLES[p.role]?.shortTitle || p.role;
          lines.push(`• [${p.id}] ${p.name.padEnd(28)} | ${roleTitle.padEnd(16)} | PIN: ${p.pinCode || '----'} | VK: vk.com/${p.vkId}`);
        });
        lines.push('');
      }
    });

    const benchMembers = participants.filter((p) => p.groupId === null);
    if (benchMembers.length > 0) {
      lines.push('--- РЕЗЕРВ / НЕ РАСПРЕДЕЛЕНЫ ---');
      benchMembers.forEach((p) => {
        const roleTitle = ROLES[p.role]?.shortTitle || p.role;
        lines.push(`• [${p.id}] ${p.name.padEnd(28)} | ${roleTitle.padEnd(16)} | PIN: ${p.pinCode || '----'} | VK: vk.com/${p.vkId}`);
      });
      lines.push('');
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 2500);
  };

  // Download TXT
  const handleDownloadTxt = () => {
    const lines = [
      '===========================================================',
      'КИНОЛАБОРАТОРИЯ — ВЕДОМОСТЬ ПЕРСОНАЛЬНЫХ PIN-КОДОВ ДОСТУПА',
      `Всего участников: ${participants.length}`,
      '===========================================================',
      '',
    ];

    participants.forEach((p) => {
      const g = groups.find((grp) => grp.id === p.groupId);
      const groupName = g ? `Группа ${g.number}` : 'Резерв';
      const roleTitle = ROLES[p.role]?.title || p.role;
      lines.push(`${p.id}\t${p.name}\t${roleTitle}\t${groupName}\tPIN: ${p.pinCode || '----'}\thttps://vk.com/${p.vkId}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cinelab_participant_pins_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Batch regenerate for all
  const handleBatchRegenerateAll = () => {
    participants.forEach((p) => {
      const fresh = generateRandomPin();
      onUpdateParticipantPin(p.id, fresh);
    });
    setIsBatchConfirmOpen(false);
  };

  return (
    <div className="space-y-6 w-full max-w-[1800px] 2xl:max-w-[2100px] mx-auto animate-fade-in">
      {/* Top Banner / Stats */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Безопасность и контроль доступа</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Реестр персональных PIN-кодов участников</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono font-normal">
                {participants.length} человек
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Каждому участнику присвоен индивидуальный 4-значный код безопасности. Вход по единому паролю 1234
              заблокирован. Здесь куратор может просмотреть код любого студента, скопировать персональное
              приглашение для отправки в VK, быстро восстановить или сменить PIN.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0">
            <button
              onClick={() => setShowAllPins(!showAllPins)}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1.5"
              title="Скрыть/показать цифры на случай показа экрана"
            >
              {showAllPins ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
              <span>{showAllPins ? 'Скрыть коды' : 'Показать коды'}</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Скопировать ведомость всех участников с кодами"
            >
              {isCopiedAll ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-300" />
                  <span>Скопировать всё</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1.5"
              title="Скачать ведомость в текстовый файл"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>Скачать .txt</span>
            </button>

            <button
              onClick={() => setIsBatchConfirmOpen(true)}
              className="px-3 py-2 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Сгенерировать случайные коды всем участникам сразу"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Обновить все PIN</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-zinc-800/80 text-xs">
          <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
            <div className="text-zinc-500 font-medium">Всего участников</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{participants.length}</div>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
            <div className="text-zinc-500 font-medium">Съёмочных групп</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{groups.length} групп</div>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
            <div className="text-zinc-500 font-medium">В резерве цехов</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
              {participants.filter((p) => p.groupId === null).length} чел.
            </div>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
            <div className="text-zinc-500 font-medium">Защита 1234</div>
            <div className="text-base font-bold text-rose-400 font-mono mt-0.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Заблокирована</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, роли, ID (например, CINE-01) или VK..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Group Filter Tabs / Select */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 overflow-x-auto max-w-full text-xs">
            <button
              onClick={() => setSelectedGroupFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedGroupFilter === 'all'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Все ({participants.length})
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupFilter(g.id)}
                className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedGroupFilter === g.id
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Гр. {g.number}
              </button>
            ))}
            <button
              onClick={() => setSelectedGroupFilter('bench')}
              className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedGroupFilter === 'bench'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Резерв
            </button>
          </div>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">Все 12 цехов</option>
            {Object.entries(ROLES).map(([key, def]) => (
              <option key={key} value={key}>
                {def.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participants List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>Найдено участников: <strong className="text-zinc-200">{filteredParticipants.length}</strong></span>
          <span className="text-[11px] text-zinc-500">Кликните на код для быстрого копирования</span>
        </div>

        {filteredParticipants.length === 0 ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Участники не найдены</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              По запросу «{searchQuery}» совпадений не обнаружено. Попробуйте изменить параметры поиска или фильтра.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGroupFilter('all');
                setSelectedRoleFilter('all');
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredParticipants.map((p) => {
              const roleDef = ROLES[p.role];
              const group = groups.find((g) => g.id === p.groupId);
              const isPinVisible = showAllPins || visiblePins[p.id];
              const isCopied = copiedId === p.id;
              const isInviteCopied = copiedInviteId === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 shadow-md hover:shadow-lg group"
                >
                  {/* Participant Header Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-cover border border-zinc-700/70 shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white truncate">{p.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                            {p.id}
                          </span>
                        </div>

                        {/* Role & Group badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              roleDef?.badgeBg || 'bg-zinc-800 border-zinc-700'
                            } ${roleDef?.badgeText || 'text-zinc-200'}`}
                          >
                            {roleDef?.title || p.role}
                          </span>

                          {group ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium">
                              Группа {group.number}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900 text-amber-300 font-medium">
                              Резерв
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* VK link */}
                    <a
                      href={p.vkUrl || `https://vk.com/${p.vkId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`VK: vk.com/${p.vkId}`}
                      className="p-1.5 text-zinc-500 hover:text-sky-400 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-sky-500/50 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* PIN Display & Actions Row */}
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 font-medium">Персональный PIN:</div>
                        <div className="font-mono text-base font-bold text-emerald-400 tracking-widest flex items-center gap-1.5">
                          {isPinVisible ? (
                            <span>{p.pinCode || '----'}</span>
                          ) : (
                            <span className="text-zinc-500 tracking-wider">••••</span>
                          )}
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(p.id)}
                            className="text-zinc-500 hover:text-zinc-300 p-0.5 ml-1"
                            title={isPinVisible ? 'Скрыть PIN' : 'Показать PIN'}
                          >
                            {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyPin(p)}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono font-medium border border-zinc-700 transition-colors flex items-center gap-1"
                        title="Скопировать PIN-код"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300 text-[11px]">Скопирован</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[11px]">Код</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopyVkInvite(p)}
                        className="px-2.5 py-1.5 bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 rounded-lg text-xs font-medium border border-sky-800/60 transition-colors flex items-center gap-1"
                        title="Скопировать готовое сообщение для отправки участнику в VK"
                      >
                        {isInviteCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300 text-[11px]">Готово!</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-[11px]">Для VK</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Footer: Quick Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRegeneratePin(p)}
                        className="p-1.5 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                        title="Сгенерировать новый случайный PIN-код для этого участника"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400" />
                        <span>Случайный</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                        title="Вручную ввести собственный PIN-код"
                      >
                        <Edit2 className="w-3 h-3 text-zinc-500" />
                        <span>Изменить</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectMemberForCabinet(p)}
                      className="text-zinc-400 hover:text-blue-400 text-[11px] font-medium flex items-center gap-1 hover:underline"
                      title="Открыть личный кабинет этого участника"
                    >
                      <span>Кабинет</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Edit PIN Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-800 flex items-center justify-center text-emerald-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Редактирование PIN-кода</h4>
                  <p className="text-xs text-zinc-400">{editingParticipant.name} ({editingParticipant.id})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingParticipant(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualPin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Новый 4-значный цифровой код:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={manualPinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setManualPinInput(val);
                      setEditError(null);
                    }}
                    placeholder="Например, 4829"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-center font-mono text-xl tracking-widest text-emerald-400 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setManualPinInput(generateRandomPin())}
                    className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1"
                    title="Сгенерировать случайное число"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Случайный</span>
                  </button>
                </div>
              </div>

              {editError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                  {editError}
                </div>
              )}

              <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <div>• Код должен состоять строго из 4 цифр (от 1000 до 9999).</div>
                <div>• После сохранения участник сможет зайти в свой кабинет по этому коду.</div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20"
                >
                  Сохранить PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Confirm Modal */}
      {isBatchConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-300 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Перегенерировать коды всем?</h4>
                <p className="text-xs text-zinc-400">Массовое обновление PIN-кодов</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Вы уверены, что хотите сгенерировать новые случайные 4-значные PIN-коды для всех {participants.length} участников?
              Старые коды перестанут действовать. После этого вы сможете скопировать новую ведомость и раздать коды студентам.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsBatchConfirmOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={handleBatchRegenerateAll}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20"
              >
                Да, сгенерировать всем
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
