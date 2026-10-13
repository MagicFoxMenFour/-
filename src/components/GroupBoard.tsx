import React, { useState } from 'react';
import {
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  Clock,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Eye,
} from 'lucide-react';
import {
  ConflictItem,
  FilmGroup,
  Participant,
  RoleType,
} from '../types';
import { ROLES } from '../data/roles';

interface GroupBoardProps {
  groups: FilmGroup[];
  participants: Participant[];
  conflicts: ConflictItem[];
  isAdmin?: boolean;
  onMoveParticipant: (participantId: string, newGroupId: string | null) => void;
  onChangeRole: (participantId: string, newRole: RoleType) => void;
  onOpenAddGroup: () => void;
  onOpenAddParticipant: () => void;
  onEditGroup: (group: FilmGroup) => void;
  onEditParticipant: (participant: Participant) => void;
  onDeleteGroup: (groupId: string) => void;
  onSelectMemberForCabinet: (participant: Participant) => void;
  onOpenVkDispatch: (
    group: FilmGroup,
    initialTab?: 'call_sheet' | 'announcement' | 'chat_setup'
  ) => void;
  onRemoveAvoidLink?: (p1Id: string, p2Id: string) => void;
}

export const GroupBoard: React.FC<GroupBoardProps> = ({
  groups,
  participants,
  conflicts,
  isAdmin = true,
  onMoveParticipant,
  onChangeRole,
  onOpenAddGroup,
  onOpenAddParticipant,
  onEditGroup,
  onEditParticipant,
  onDeleteGroup,
  onSelectMemberForCabinet,
  onOpenVkDispatch,
  onRemoveAvoidLink,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter participants
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vkId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ROLES[p.role]?.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const benchParticipants = filteredParticipants.filter((p) => !p.groupId && p.role !== 'actor');
  const actorParticipants = participants.filter((p) => p.role === 'actor');

  return (
    <div className="space-y-6">
      {/* Participant Read-only Notice Banner */}
      {!isAdmin && (
        <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Режим участника (Только чтение):</span>{' '}
              <span>
                Вам доступен просмотр составов всех 7 съёмочных групп и контактов VK. Изменение составов и редактирование групп доступно только администраторам.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 sm:p-3.5 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ФИО, ID, роли или VK..."
              className="w-full bg-zinc-950 border border-zinc-700 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-500"
          >
            <option value="all">Все роли ({participants.length})</option>
            {Object.values(ROLES).map((role) => (
              <option key={role.type} value={role.type}>
                {role.shortTitle}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher and Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Вид карточками"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Вид списком"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isAdmin && (
            <>
              <button
                onClick={onOpenAddParticipant}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Участник</span>
              </button>

              <button
                onClick={onOpenAddGroup}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Новая группа</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Container */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {groups.map((group) => {
            const groupMembers = filteredParticipants.filter((p) => p.groupId === group.id);
            const allGroupMembers = participants.filter((p) => p.groupId === group.id);
            const groupConflicts = conflicts.filter((c) => c.groupId === group.id);

            return (
              <div
                key={group.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-750 rounded-xl flex flex-col shadow-sm transition-all"
              >
                {/* Group Header */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 rounded-t-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">
                            {group.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-850 text-zinc-400 border border-zinc-800 font-mono">
                            {allGroupMembers.length} чел.
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditGroup(group)}
                            title="Редактировать название и состав группы"
                            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* VK Chat and Call Sheet Dispatch Bar */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${group.vkChatUrl ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {group.vkChatUrl ? (
                            <a
                              href={group.vkChatUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-mono"
                            >
                              <span>Беседа VK</span>
                              <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                            </a>
                          ) : (
                            <button
                              onClick={() => onOpenVkDispatch(group, 'chat_setup')}
                              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                            >
                              <span>+ Создать беседу VK</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => onOpenVkDispatch(group, 'chat_setup')}
                          title="Настройка и подключение ссылки на беседу VK"
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          {group.vkChatUrl ? 'Настроить' : 'Мастер ссылки'}
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenVkDispatch(group, 'call_sheet')}
                        title="Сформировать вызывной лист или объявление для группы в VK"
                        className="w-full text-xs py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white font-medium transition-colors flex items-center justify-center gap-1.5 border border-zinc-700/60 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        <span>Отправить вызывной / уведомление в VK</span>
                      </button>
                    </div>

                    {/* Conflicts and warnings badge */}
                    {(() => {
                      const avoidCount = groupConflicts.filter((c) => c.type === 'avoided_partner_conflict').length;
                      const roleCount = groupConflicts.filter((c) => c.type !== 'avoided_partner_conflict').length;

                      if (avoidCount === 0 && roleCount === 0) return null;

                      return (
                        <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                          {avoidCount > 0 ? (
                            <span
                              className="text-[11px] font-bold text-rose-300 bg-rose-950/90 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse"
                              title="В группе есть участники из стоп-листа!"
                            >
                              <span>⛔ Стоп-лист: {avoidCount}</span>
                            </span>
                          ) : (
                            <span />
                          )}

                          {roleCount > 0 && (
                            <span
                              className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800 px-2 py-0.5 rounded"
                              title="Дисбаланс ролей в группе"
                            >
                              Предупреждений: {roleCount}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                </div>

                {/* Members list */}
                <div className="p-3 space-y-2 flex-1 min-h-[220px]">
                  {groupMembers.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-6 text-center text-zinc-500 text-xs">
                      Нет участников в группе
                    </div>
                  ) : (
                    groupMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        groups={groups}
                        allParticipants={participants}
                        isAdmin={isAdmin}
                        onMoveParticipant={onMoveParticipant}
                        onChangeRole={onChangeRole}
                        onEditParticipant={onEditParticipant}
                        onSelectMemberForCabinet={onSelectMemberForCabinet}
                        onRemoveAvoidLink={onRemoveAvoidLink}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Reserve Bench Column */}
          <div className="bg-zinc-900/60 border border-dashed border-zinc-800 rounded-xl flex flex-col shadow-inner">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">
                  Резерв лаборатории
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Участники на распределение ({benchParticipants.length})
                </p>
              </div>
            </div>

            <div className="p-3 space-y-2 flex-1 min-h-[220px]">
              {benchParticipants.length === 0 ? (
                <div className="h-full flex items-center justify-center p-6 text-center text-zinc-500 text-xs">
                  Все участники распределены
                </div>
              ) : (
                benchParticipants.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    groups={groups}
                    allParticipants={participants}
                    isAdmin={isAdmin}
                    onMoveParticipant={onMoveParticipant}
                    onChangeRole={onChangeRole}
                    onEditParticipant={onEditParticipant}
                    onSelectMemberForCabinet={onSelectMemberForCabinet}
                    onRemoveAvoidLink={onRemoveAvoidLink}
                    isBench
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Table View: Full concise list of all participants grouped by team */
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">ФИО участника</th>
                  <th className="px-4 py-3">Роль</th>
                  <th className="px-4 py-3">Съёмочная группа</th>
                  <th className="px-4 py-3">ВКонтакте (VK)</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredParticipants.map((p) => {
                  const grp = groups.find((g) => g.id === p.groupId);
                  const roleDef = ROLES[p.role];

                  return (
                    <tr key={p.id} className="hover:bg-zinc-850/60 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                        {p.id}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-white">
                        <button
                          onClick={() => onSelectMemberForCabinet(p)}
                          className="hover:underline text-left"
                        >
                          {p.name}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {roleDef?.title || p.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {grp ? (
                          <span className="text-xs text-zinc-300">{grp.name}</span>
                        ) : p.role === 'actor' ? (
                          <span className="text-xs text-emerald-400 font-medium">Актёрский пул (свободный)</span>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">Резерв</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        <a
                          href={p.vkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                        >
                          <span>{p.vkId}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </a>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {grp && (
                            <button
                              onClick={() => onOpenVkDispatch(grp, 'call_sheet')}
                              title={`Отправить вызывной / уведомление группе «${grp.name}» в VK`}
                              className="text-xs text-blue-400 hover:text-white px-2 py-1 bg-zinc-800 hover:bg-zinc-750 rounded transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Вызывной VK</span>
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => onEditParticipant(p)}
                              title="Редактировать участника"
                              className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectMemberForCabinet(p)}
                            className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 hover:bg-zinc-750 rounded transition-colors"
                          >
                            {isAdmin ? 'Кабинет' : 'Профиль'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actors Pool Table: Independent actors who can film in multiple projects simultaneously */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-750 flex items-center justify-center text-lg">
              🎭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Актёрский пул лаборатории
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {actorParticipants.length} актёров
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Актёры не закреплены за одной группой и могут сниматься одновременно в нескольких картинах (свободный график)
              </p>
            </div>
          </div>
        </div>

        {actorParticipants.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            В лаборатории пока нет зарегистрированных актёров. Вы можете добавить актёра через кнопку «+ Участник» выбрав роль «Актёр».
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Актёр / Исполнитель</th>
                  <th className="px-4 py-3">Желаемые роли</th>
                  <th className="px-4 py-3">Участие в картинах</th>
                  <th className="px-4 py-3">ВКонтакте</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {actorParticipants.map((actor) => (
                  <tr key={actor.id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {actor.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <button
                          onClick={() => onSelectMemberForCabinet(actor)}
                          className="hover:underline text-left"
                        >
                          {actor.name}
                        </button>
                        {(actor.avoidedWithIds || []).length > 0 && (
                          <span
                            title={`В стоп-листе: ${(actor.avoidedWithIds || []).length}`}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-rose-300 font-mono"
                          >
                            🚫 {(actor.avoidedWithIds || []).length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-300">
                      {actor.desiredRoles && actor.desiredRoles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {actor.desiredRoles.map((dr, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-800 text-indigo-300 text-[11px] font-mono">
                              {ROLES[dr]?.shortTitle || dr}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic text-[11px]">Пожелания не указаны</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {actor.groupId ? (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs font-medium">
                            {groups.find((g) => g.id === actor.groupId)?.name || actor.groupId}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-emerald-400 text-xs font-medium border border-zinc-700">
                            Свободный график (все картины)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <a
                        href={actor.vkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <span>{actor.vkId}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => onEditParticipant(actor)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                            title="Редактировать актёра"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectMemberForCabinet(actor)}
                          className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 hover:bg-zinc-750 rounded transition-colors"
                        >
                          Кабинет
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

interface MemberRowProps {
  member: Participant;
  groups: FilmGroup[];
  allParticipants: Participant[];
  isAdmin?: boolean;
  onMoveParticipant: (participantId: string, newGroupId: string | null) => void;
  onChangeRole: (participantId: string, newRole: RoleType) => void;
  onEditParticipant: (participant: Participant) => void;
  onSelectMemberForCabinet: (participant: Participant) => void;
  onRemoveAvoidLink?: (p1Id: string, p2Id: string) => void;
  isBench?: boolean;
}

const MemberRow: React.FC<MemberRowProps> = ({
  member,
  groups,
  allParticipants,
  isAdmin = true,
  onMoveParticipant,
  onChangeRole,
  onEditParticipant,
  onSelectMemberForCabinet,
  onRemoveAvoidLink,
  isBench,
}) => {
  const roleDef = ROLES[member.role];

  // Check outbound (this member avoids other)
  const outboundAvoided = !isBench && member.groupId
    ? allParticipants.filter(
        (other) =>
          other.groupId === member.groupId &&
          other.id !== member.id &&
          (member.avoidedWithIds || []).includes(other.id) &&
          !(other.avoidedWithIds || []).includes(member.id)
      )
    : [];

  // Check inbound (other member avoids this member, but this member does not avoid other)
  const inboundAvoided = !isBench && member.groupId
    ? allParticipants.filter(
        (other) =>
          other.groupId === member.groupId &&
          other.id !== member.id &&
          !(member.avoidedWithIds || []).includes(other.id) &&
          (other.avoidedWithIds || []).includes(member.id)
      )
    : [];

  // Check mutual (both avoid each other)
  const mutualAvoided = !isBench && member.groupId
    ? allParticipants.filter(
        (other) =>
          other.groupId === member.groupId &&
          other.id !== member.id &&
          (member.avoidedWithIds || []).includes(other.id) &&
          (other.avoidedWithIds || []).includes(member.id)
      )
    : [];

  const hasAvoidConflict =
    outboundAvoided.length > 0 || inboundAvoided.length > 0 || mutualAvoided.length > 0;
  const avoidedCount = (member.avoidedWithIds || []).length;

  return (
    <div
      className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between gap-2 text-sm ${
        hasAvoidConflict
          ? 'bg-rose-950/40 border-rose-800/80 hover:border-rose-700 shadow-sm'
          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              onClick={() => onSelectMemberForCabinet(member)}
              className="font-medium text-white cursor-pointer hover:underline text-sm"
            >
              {member.name}
            </span>
            <span className="text-xs font-mono text-zinc-500 shrink-0">
              {member.id}
            </span>
            {avoidedCount > 0 && !hasAvoidConflict && (
              <span
                title={`Участник указал ${avoidedCount} чел. в стоп-листе`}
                className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-rose-300/80 font-mono"
              >
                🚫 {avoidedCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-semibold text-zinc-300">
              {roleDef?.shortTitle || member.role}
            </span>
            <span
              title="Роль официально закреплена куратором"
              className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-750 text-emerald-400 font-mono"
            >
              ✓ Закреплена
            </span>
            {member.desiredRoles && member.desiredRoles.length > 0 && (
              <span
                title={`Желаемые роли участника (из личного кабинета): ${member.desiredRoles.map((r) => ROLES[r]?.shortTitle || r).join(', ')}`}
                className={`text-[10px] px-1.5 py-0.2 rounded border font-mono flex items-center gap-1 ${
                  member.desiredRoles.includes(member.role)
                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                    : 'bg-indigo-950/70 border-indigo-800 text-indigo-300'
                }`}
              >
                <span>🎯 Хочет:</span>
                <span>{member.desiredRoles.map((r) => ROLES[r]?.shortTitle || r).join(', ')}</span>
                {member.desiredRoles.includes(member.role) && (
                  <span className="text-emerald-400 font-bold" title="Закреплённая куратором роль совпала с желанием участника">✓</span>
                )}
              </span>
            )}
            <span className="text-zinc-600">•</span>
            <a
              href={member.vkUrl}
              target="_blank"
              rel="noreferrer"
              title={`Открыть VK: ${member.vkUrl}`}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
            >
              <span>{member.vkId}</span>
              <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
            </a>
          </div>

          {/* Critical Avoid Conflict Warning */}
          {hasAvoidConflict && (
            <div className="mt-1.5 p-1.5 rounded bg-rose-950/80 border border-rose-800 text-[11px] text-rose-200 flex flex-col gap-1">
              {mutualAvoided.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-rose-200">
                    ⛔ Взаимный стоп-лист: {mutualAvoided.map((c) => c.name).join(', ')}
                  </span>
                  {onRemoveAvoidLink && (
                    <button
                      type="button"
                      onClick={() => mutualAvoided.forEach((c) => onRemoveAvoidLink(member.id, c.id))}
                      className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-850 text-white text-[10px] font-bold"
                    >
                      Снять взаимно
                    </button>
                  )}
                </div>
              )}
              {outboundAvoided.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span>⛔ В стоп-листе у участника: {outboundAvoided.map((c) => c.name).join(', ')}</span>
                  {onRemoveAvoidLink && (
                    <button
                      type="button"
                      onClick={() => outboundAvoided.forEach((c) => onRemoveAvoidLink(member.id, c.id))}
                      className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-850 text-white text-[10px] font-bold"
                    >
                      Убрать из стоп-листа
                    </button>
                  )}
                </div>
              )}
              {inboundAvoided.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-rose-300">⚠️ {inboundAvoided.map((c) => c.name).join(', ')} внёс(ла) данного участника в свой стоп-лист</span>
                  {onRemoveAvoidLink && (
                    <button
                      type="button"
                      onClick={() => inboundAvoided.forEach((c) => onRemoveAvoidLink(c.id, member.id))}
                      className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-850 text-white text-[10px] font-bold"
                    >
                      Снять у коллеги
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEditParticipant(member)}
            title="Редактировать данные участника"
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Quick move dropdown */}
          <select
            value={member.groupId || 'bench'}
            onChange={(e) => {
              const val = e.target.value;
              onMoveParticipant(member.id, val === 'bench' ? null : val);
            }}
            className={`border text-xs rounded px-1.5 py-1 focus:outline-none ${
              hasAvoidConflict
                ? 'bg-rose-950 border-rose-700 text-rose-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
            title="Переместить в другую группу"
          >
            <option value="bench">Резерв</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
