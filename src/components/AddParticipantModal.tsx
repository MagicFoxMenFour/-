import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { FilmGroup, Participant, RoleType } from '../types';
import { ROLES } from '../data/roles';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: FilmGroup[];
  allParticipants: Participant[];
  onAddParticipant: (participant: Participant) => void;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  isOpen,
  onClose,
  groups,
  allParticipants,
  onAddParticipant,
}) => {
  const nextId = `CINE-${String(allParticipants.length + 1).padStart(2, '0')}`;
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleType>('director');
  const [vkId, setVkId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState<string>('bench');
  const [skillsText, setSkillsText] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredId, setPreferredId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let cleanVk = vkId.trim() || `id_${Date.now().toString().slice(-6)}`;
    if (cleanVk.startsWith('https://vk.com/')) {
      cleanVk = cleanVk.replace('https://vk.com/', '');
    }

    const newParticipant: Participant = {
      id: nextId,
      name: name.trim(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      vkId: cleanVk,
      vkUrl: `https://vk.com/${cleanVk}`,
      role,
      groupId: targetGroupId === 'bench' ? null : targetGroupId,
      preferredWithIds: preferredId ? [preferredId] : [],
      avoidedWithIds: [],
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      notes: notes.trim(),
    };

    onAddParticipant(newParticipant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-zinc-200" />
            <h3 className="text-base font-bold text-white">
              Добавить участника ({nextId})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                ФИО участника:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Смирнов"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Роль:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                {Object.values(ROLES).map((r) => (
                  <option key={r.type} value={r.type}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Профиль ВКонтакте (VK):
              </label>
              <input
                type="text"
                required
                value={vkId}
                onChange={(e) => setVkId(e.target.value)}
                placeholder="smirnov_cine или id..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Назначить в группу:
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="bench">Резерв (скамейка запасных)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Пожелание по напарнику:
            </label>
            <select
              value={preferredId}
              onChange={(e) => setPreferredId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="">Без предпочтений</option>
              {allParticipants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({ROLES[p.role]?.shortTitle || p.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Навыки и техника:
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Свет, стедикам, DaVinci"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Заметки:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Опыт, портфолио..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
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
        </form>
      </div>
    </div>
  );
};
