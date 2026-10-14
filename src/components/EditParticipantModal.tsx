import React, { useState, useEffect } from 'react';
import { User, X, Trash2, KeyRound, Sparkles } from 'lucide-react';
import { FilmGroup, Participant, RoleType } from '../types';
import { ROLES } from '../data/roles';
import { generateRandomPin, setParticipantPin } from '../services/accessControl';

interface EditParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  groups: FilmGroup[];
  allParticipants: Participant[];
  onSaveParticipant: (updatedParticipant: Participant) => void;
  onDeleteParticipant: (participantId: string) => void;
  onRemoveInboundAvoid?: (sourceParticipantId: string, targetParticipantId: string) => void;
}

export const EditParticipantModal: React.FC<EditParticipantModalProps> = ({
  isOpen,
  onClose,
  participant,
  groups,
  allParticipants,
  onSaveParticipant,
  onDeleteParticipant,
  onRemoveInboundAvoid,
}) => {
  const [name, setName] = useState(participant?.name || '');
  const [role, setRole] = useState<RoleType>(participant?.role || 'director');
  const [groupId, setGroupId] = useState<string | null>(participant?.groupId || null);
  const [vkId, setVkId] = useState(participant?.vkId || '');
  const [pinCode, setPinCode] = useState(participant?.pinCode || '');
  const [skills, setSkills] = useState(participant?.skills ? participant.skills.join(', ') : '');
  const [notes, setNotes] = useState(participant?.notes || '');
  const [preferredWithIds, setPreferredWithIds] = useState<string[]>(
    participant?.preferredWithIds || []
  );
  const [avoidedWithIds, setAvoidedWithIds] = useState<string[]>(
    participant?.avoidedWithIds || []
  );
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (participant) {
      setName(participant.name);
      setRole(participant.role);
      setGroupId(participant.groupId);
      setVkId(participant.vkId);
      setPinCode(participant.pinCode || '');
      setSkills((participant.skills || []).join(', '));
      setNotes(participant.notes || '');
      setPreferredWithIds(participant.preferredWithIds || []);
      setAvoidedWithIds(participant.avoidedWithIds || []);
    }
  }, [participant]);

  if (!isOpen || !participant) return null;

  const handleTogglePartner = (id: string) => {
    if (preferredWithIds.includes(id)) {
      setPreferredWithIds(preferredWithIds.filter((pId) => pId !== id));
    } else {
      setPreferredWithIds([...preferredWithIds, id]);
      setAvoidedWithIds(avoidedWithIds.filter((aId) => aId !== id));
    }
  };

  const handleToggleAvoided = (id: string) => {
    if (avoidedWithIds.includes(id)) {
      setAvoidedWithIds(avoidedWithIds.filter((aId) => aId !== id));
    } else {
      setAvoidedWithIds([...avoidedWithIds, id]);
      setPreferredWithIds(preferredWithIds.filter((pId) => pId !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanVk = vkId.trim();
    if (cleanVk.startsWith('https://vk.com/')) {
      cleanVk = cleanVk.replace('https://vk.com/', '');
    }

    onSaveParticipant({
      ...participant,
      name: name.trim() || participant.name,
      role,
      groupId: groupId === 'bench' ? null : groupId,
      vkId: cleanVk,
      vkUrl: `https://vk.com/${cleanVk}`,
      skills: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      notes: notes.trim(),
      preferredWithIds,
      avoidedWithIds,
      pinCode: pinCode.trim().length === 4 ? pinCode.trim() : participant.pinCode,
    });
    if (pinCode.trim().length === 4) {
      setParticipantPin(participant.id, pinCode.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{participant.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {participant.id}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Редактирование данных участника, роли, группы и привязки VK
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                ФИО участника:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Закреплённая роль (утверждается куратором):
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  ✓ Утверждение куратора
                </span>
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              >
                {Object.values(ROLES).map((r) => (
                  <option key={r.type} value={r.type}>
                    {r.title}
                  </option>
                ))}
              </select>

              {participant?.desiredRoles && participant.desiredRoles.length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-indigo-950/40 border border-indigo-850 text-xs">
                  <div className="text-[11px] font-semibold text-indigo-300 flex items-center justify-between mb-1">
                    <span>🎯 Пожелания участника:</span>
                    {participant.desiredRoles.includes(role) ? (
                      <span className="text-[10px] text-emerald-400 font-bold">✓ Совпадает с назначением</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRole(participant.desiredRoles![0])}
                        className="text-[10px] text-indigo-300 hover:text-white underline"
                      >
                        Назначить желаемую ({ROLES[participant.desiredRoles[0]]?.shortTitle})
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {participant.desiredRoles.map((dr) => (
                      <span
                        key={dr}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          dr === role
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                        }`}
                      >
                        {ROLES[dr]?.shortTitle || dr}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Съёмочная группа:
              </label>
              <select
                value={groups.some((g) => g.id === groupId) ? (groupId || 'bench') : 'bench'}
                onChange={(e) =>
                  setGroupId(e.target.value === 'bench' ? null : e.target.value)
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="bench">Резерв (скамейка запасных)</option>
                {[...groups].sort((a, b) => (a.number || 0) - (b.number || 0)).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Профиль ВКонтакте (VK ID):
              </label>
              <input
                type="text"
                value={vkId}
                onChange={(e) => setVkId(e.target.value)}
                placeholder="ivan_filmmaker или id123"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Персональный PIN-код (4 цифры):</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Доступ к личному кабинету</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Например, 4829"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono font-bold tracking-widest focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setPinCode(generateRandomPin())}
                className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5"
                title="Сгенерировать случайный PIN"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Случайный</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Особые умения (через запятую):
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Пою, танцую, знаю IT, программирование..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Заметки и договоренности:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Особые условия, пожелания по сменам..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Preferences: Preferred & Avoided Partners */}
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1">
                <span>❤️ Желаемые напарники (с кем хочет работать):</span>
                <span className="font-mono text-zinc-400 text-[11px]">
                  Выбрано: {preferredWithIds.length}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                {allParticipants
                  .filter((p) => p.id !== participant.id)
                  .map((p) => {
                    const isChecked = preferredWithIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${
                          isChecked
                            ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                            : 'hover:bg-zinc-900 text-zinc-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePartner(p.id)}
                          className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                        />
                        <span className="truncate">
                          {p.name} ({ROLES[p.role]?.shortTitle || p.role})
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-rose-400 mb-1">
                <span>🚫 Стоп-лист (с кем НЕ хочет работать):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400 text-[11px]">
                    В стоп-листе: {avoidedWithIds.length}
                  </span>
                  {avoidedWithIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAvoidedWithIds([])}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline font-normal"
                    >
                      Очистить
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                {allParticipants
                  .filter((p) => p.id !== participant.id)
                  .map((p) => {
                    const isAvoided = avoidedWithIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${
                          isAvoided
                            ? 'bg-rose-950/60 border border-rose-800 text-rose-200'
                            : 'hover:bg-zinc-900 text-zinc-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAvoided}
                          onChange={() => handleToggleAvoided(p.id)}
                          className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-0"
                        />
                        <span className="truncate">
                          {p.name} ({ROLES[p.role]?.shortTitle || p.role})
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Inbound stop-lists: people who added THIS participant to their stop-list */}
            {(() => {
              const inboundAvoiders = allParticipants.filter(
                (other) => other.id !== participant.id && (other.avoidedWithIds || []).includes(participant.id)
              );
              if (inboundAvoiders.length === 0) return null;

              return (
                <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-300">
                      ⚠️ Участник указан в чужих стоп-листах ({inboundAvoiders.length}):
                    </span>
                    {onRemoveInboundAvoid && (
                      <button
                        type="button"
                        onClick={() => {
                          inboundAvoiders.forEach((inv) => onRemoveInboundAvoid(inv.id, participant.id));
                        }}
                        className="text-[11px] text-rose-300 hover:text-white underline"
                      >
                        Убрать отовсюду
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {inboundAvoiders.map((other) => (
                      <span
                        key={other.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-900/60 border border-rose-800 text-rose-200 text-[11px]"
                      >
                        <span>{other.name} ({other.groupId ? groups.find(g => g.id === other.groupId)?.name : 'Резерв'})</span>
                        {onRemoveInboundAvoid && (
                          <button
                            type="button"
                            onClick={() => onRemoveInboundAvoid(other.id, participant.id)}
                            title="Убрать из стоп-листа этого человека"
                            className="text-rose-400 hover:text-white ml-0.5 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-rose-300/80 mt-1">
                    Пока эти участники не снимут ограничение, при попадании в одну группу будет отображаться конфликт. Нажмите «✕» чтобы снять принудительно.
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/80 p-1.5 rounded-xl text-xs">
                <span className="text-red-300 font-medium px-2">Удалить участника?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteParticipant(participant.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold"
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-1 text-zinc-400 hover:text-white"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить участника</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition-colors shadow"
              >
                Сохранить
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
