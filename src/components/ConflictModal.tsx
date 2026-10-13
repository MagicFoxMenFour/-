import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Ban,
  ShieldCheck,
  Heart,
  Trash2,
} from 'lucide-react';
import { ConflictItem, FilmGroup, Participant, RoleType } from '../types';
import { ROLES } from '../data/roles';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictItem[];
  groups: FilmGroup[];
  participants: Participant[];
  onMoveParticipant: (participantId: string, newGroupId: string | null) => void;
  onChangeRole: (participantId: string, newRole: RoleType) => void;
  onAutoBalance: () => void;
  onRemoveAvoidLink?: (p1Id: string, p2Id: string) => void;
  onClearAllStopLists?: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  groups,
  participants,
  onMoveParticipant,
  onChangeRole,
  onAutoBalance,
  onRemoveAvoidLink,
  onClearAllStopLists,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'avoided' | 'roles' | 'preferences'>('all');
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  if (!isOpen) return null;

  const avoidedConflicts = conflicts.filter((c) => c.type === 'avoided_partner_conflict');
  const roleConflicts = conflicts.filter(
    (c) => c.type === 'duplicate_role' || c.type === 'missing_role' || c.type === 'overcapacity'
  );
  const prefConflicts = conflicts.filter((c) => c.type === 'broken_preference');

  const filteredConflicts = conflicts.filter((c) => {
    if (filterTab === 'avoided') return c.type === 'avoided_partner_conflict';
    if (filterTab === 'roles')
      return c.type === 'duplicate_role' || c.type === 'missing_role' || c.type === 'overcapacity';
    if (filterTab === 'preferences') return c.type === 'broken_preference';
    return true;
  });

  const totalStopListEntries = participants.reduce(
    (sum, p) => sum + (p.avoidedWithIds || []).length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              avoidedConflicts.length > 0
                ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-100'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Мониторинг лаборатории</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-mono font-bold ${
                  avoidedConflicts.length > 0
                    ? 'bg-rose-900 text-rose-200'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {conflicts.length}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Контроль стоп-листов, лимитов ролей и связок в реальном времени
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

        {/* Filter Tabs & Quick Actions Bar */}
        <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterTab === 'all'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Все ({conflicts.length})
            </button>
            <button
              onClick={() => setFilterTab('avoided')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                filterTab === 'avoided'
                  ? 'bg-rose-950 border border-rose-700 text-rose-200 shadow-sm'
                  : avoidedConflicts.length > 0
                  ? 'text-rose-400 hover:text-rose-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Ban className="w-3 h-3" />
              <span>Стоп-листы ({avoidedConflicts.length})</span>
            </button>
            <button
              onClick={() => setFilterTab('roles')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                filterTab === 'roles'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Роли ({roleConflicts.length})</span>
            </button>
            <button
              onClick={() => setFilterTab('preferences')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                filterTab === 'preferences'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Heart className="w-3 h-3" />
              <span>Пожелания ({prefConflicts.length})</span>
            </button>
          </div>

          {/* Clear all stop-lists button */}
          {onClearAllStopLists && totalStopListEntries > 0 && (
            <div className="flex items-center">
              {isConfirmingClearAll ? (
                <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-800 px-2 py-1 rounded-lg">
                  <span className="text-rose-200 text-[11px] font-medium">Точно очистить все стоп-листы?</span>
                  <button
                    onClick={() => {
                      onClearAllStopLists();
                      setIsConfirmingClearAll(false);
                    }}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded"
                  >
                    Да, очистить
                  </button>
                  <button
                    onClick={() => setIsConfirmingClearAll(false)}
                    className="text-zinc-400 hover:text-white text-[11px] px-1"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClearAll(true)}
                  className="px-2.5 py-1 text-rose-300 hover:text-rose-200 hover:bg-rose-950/50 rounded-lg border border-rose-900/60 transition-colors flex items-center gap-1 text-[11px]"
                  title="Очистить стоп-листы у всех участников лаборатории"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Очистить все стоп-листы ({totalStopListEntries})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {conflicts.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">
                Все группы идеально сбалансированы
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Стоп-листы чисты, ролевые ограничения соблюдены, ключевые позиции заполнены.
              </p>
            </div>
          ) : filteredConflicts.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white mb-1">
                {filterTab === 'avoided'
                  ? 'Конфликтов стоп-листа нет!'
                  : filterTab === 'roles'
                  ? 'По ролевому составу вопросов нет'
                  : 'Все пожелания учтены'}
              </h4>
              <p className="text-xs text-zinc-400">
                {filterTab === 'avoided'
                  ? 'Ни один участник из стоп-листа не находится в одной съёмочной группе с коллегой.'
                  : 'В выбранной категории замечаний не обнаружено.'}
              </p>
            </div>
          ) : (
            <>
              {/* Status info bar */}
              {avoidedConflicts.length === 0 && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center gap-2.5 text-xs text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold">Стоп-листы соблюдены:</span> несовместимостей нет. Все отображаемые пункты ниже — это рекомендации по ролям или пожеланиям.
                  </div>
                </div>
              )}

              {/* Auto balance trigger */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
                  <div className="text-xs text-zinc-300">
                    Автоматически оптимизировать составы и устранить несоответствия
                  </div>
                </div>
                <button
                  onClick={onAutoBalance}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition-colors shrink-0"
                >
                  Оптимизировать
                </button>
              </div>

              {/* Conflict items */}
              {filteredConflicts.map((conflict) => {
                const participant = conflict.participantId
                  ? participants.find((p) => p.id === conflict.participantId)
                  : null;
                const relatedParticipant = conflict.relatedParticipantId
                  ? participants.find((p) => p.id === conflict.relatedParticipantId)
                  : null;

                return (
                  <div
                    key={conflict.id}
                    className={`p-4 rounded-xl border space-y-2 text-xs ${
                      conflict.type === 'avoided_partner_conflict'
                        ? 'border-rose-800/80 bg-rose-950/20'
                        : 'border-zinc-800 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {conflict.type === 'avoided_partner_conflict' ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/90 text-rose-300 border border-rose-700 flex items-center gap-1">
                              <span>⛔ Несовместимость (Стоп-лист)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700">
                              {conflict.type === 'duplicate_role'
                                ? 'Дублирование роли'
                                : conflict.type === 'missing_role'
                                ? 'Нехватка роли'
                                : conflict.type === 'broken_preference'
                                ? 'Пожелание'
                                : 'Лимит'}
                            </span>
                          )}
                          <span className="font-semibold text-white">
                            {conflict.groupName}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-zinc-100">
                          {conflict.message}
                        </p>
                        <p className="text-zinc-400 mt-1">
                          {conflict.detail}
                        </p>
                      </div>
                    </div>

                    {/* Resolution actions */}
                    <div className="pt-2 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-zinc-400 text-xs flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-zinc-400" />
                        Совет: {conflict.suggestedActionTitle}
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
                        {conflict.type === 'duplicate_role' && participant && (
                          <>
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                onMoveParticipant(participant.id, val === 'bench' ? null : val);
                              }}
                              defaultValue=""
                              className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1 focus:outline-none"
                            >
                              <option value="" disabled>
                                Переместить...
                              </option>
                              <option value="bench">В резерв</option>
                              {groups
                                .filter((g) => g.id !== conflict.groupId)
                                .map((g) => (
                                  <option key={g.id} value={g.id}>
                                    В {g.name}
                                  </option>
                                ))}
                            </select>

                            <select
                              onChange={(e) => {
                                onChangeRole(participant.id, e.target.value as RoleType);
                              }}
                              defaultValue=""
                              className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1 focus:outline-none"
                            >
                              <option value="" disabled>
                                Сменить роль...
                              </option>
                              {Object.values(ROLES).map((r) => (
                                <option key={r.type} value={r.type}>
                                  {r.shortTitle}
                                </option>
                              ))}
                            </select>
                          </>
                        )}

                        {conflict.type === 'missing_role' && conflict.role && (
                          <select
                            onChange={(e) => {
                              const candId = e.target.value;
                              if (candId) {
                                onMoveParticipant(candId, conflict.groupId);
                              }
                            }}
                            defaultValue=""
                            className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1 focus:outline-none"
                          >
                            <option value="" disabled>
                              Назначить из резерва...
                            </option>
                            {participants
                              .filter((p) => !p.groupId && p.role === conflict.role)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                        )}

                        {conflict.type === 'broken_preference' && participant && relatedParticipant && (
                          <button
                            onClick={() => {
                              if (participant.groupId) {
                                onMoveParticipant(relatedParticipant.id, participant.groupId);
                              }
                            }}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            <Users className="w-3 h-3" />
                            <span>Объединить напарников</span>
                          </button>
                        )}

                        {conflict.type === 'avoided_partner_conflict' && relatedParticipant && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* 1-click unblock / clear avoid link */}
                            {onRemoveAvoidLink && participant && (
                              <button
                                onClick={() => {
                                  onRemoveAvoidLink(participant.id, relatedParticipant.id);
                                }}
                                className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                title="Убрать взаимное ограничение стоп-листа между этими двумя участниками"
                              >
                                <span>Снять ограничение стоп-листа</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                onMoveParticipant(relatedParticipant.id, null);
                              }}
                              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-lg text-xs font-medium transition-colors"
                              title={`Перевести ${relatedParticipant.name} в резерв`}
                            >
                              Отправить {relatedParticipant.name.split(' ')[0]} в резерв
                            </button>

                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) onMoveParticipant(relatedParticipant.id, val === 'bench' ? null : val);
                              }}
                              defaultValue=""
                              className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1 focus:outline-none"
                            >
                              <option value="" disabled>
                                Перевести в другую группу...
                              </option>
                              {groups
                                .filter((g) => g.id !== conflict.groupId)
                                .map((g) => (
                                  <option key={g.id} value={g.id}>
                                    В «{g.name}»
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            {avoidedConflicts.length > 0 ? (
              <span className="text-rose-400 font-semibold">
                Критических стоп-листов в группах: {avoidedConflicts.length}
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                ✓ Конфликтов по стоп-листам нет
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

