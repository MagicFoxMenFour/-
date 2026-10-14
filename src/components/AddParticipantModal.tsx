import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, X, KeyRound, Sparkles } from 'lucide-react';
import { FilmGroup, Participant, RoleType } from '../types';
import { ROLES } from '../data/roles';
import { generateRandomPin, setParticipantPin } from '../services/accessControl';

/**
 * Mathematically guaranteed collision-free ID generator.
 * Actors receive ACT-01, ACT-02... (or next available integer),
 * while crew participants receive CINE-XX strictly higher than any existing CINE- ID.
 * Never overwrites or collides with any existing document or account.
 */
export function generateUniqueParticipantId(
  role: RoleType,
  allParticipants: Participant[]
): string {
  const existingIds = new Set(allParticipants.map((p) => p.id.toUpperCase()));
  const prefix = role === 'actor' ? 'ACT' : 'CINE';

  let maxNum = 0;
  for (const p of allParticipants) {
    if (p.id.toUpperCase().startsWith(prefix + '-')) {
      const numPart = parseInt(p.id.replace(new RegExp(`^${prefix}-`, 'i'), ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  // For CINE, ensure it also exceeds any numeric ID present in the system
  if (prefix === 'CINE') {
    for (const p of allParticipants) {
      const match = p.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}-${String(nextNum).padStart(2, '0')}`;
  while (existingIds.has(candidate.toUpperCase())) {
    nextNum++;
    candidate = `${prefix}-${String(nextNum).padStart(2, '0')}`;
  }
  return candidate;
}

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: FilmGroup[];
  allParticipants: Participant[];
  onAddParticipant: (participant: Participant) => void;
  initialRole?: RoleType;
  initialGroupId?: string | null;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  isOpen,
  onClose,
  groups,
  allParticipants,
  onAddParticipant,
  initialRole = 'director',
  initialGroupId = 'bench',
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleType>(initialRole);
  const [vkId, setVkId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState<string>(
    initialRole === 'actor' ? 'bench' : (initialGroupId || 'bench')
  );
  const [skillsText, setSkillsText] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredId, setPreferredId] = useState<string>('');
  const [pinCode, setPinCode] = useState(() => generateRandomPin());

  // Reset fields when opening modal or changing initialRole
  useEffect(() => {
    if (isOpen) {
      setName('');
      setRole(initialRole);
      setVkId('');
      setTargetGroupId(initialRole === 'actor' ? 'bench' : (initialGroupId || 'bench'));
      setSkillsText('');
      setNotes('');
      setPreferredId('');
      setPinCode(generateRandomPin());
    }
  }, [isOpen, initialRole, initialGroupId]);

  // Dynamically calculate guaranteed unique ID for the chosen role
  const computedNextId = useMemo(() => {
    return generateUniqueParticipantId(role, allParticipants);
  }, [role, allParticipants]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let cleanVk = vkId.trim() || `id_${Date.now().toString().slice(-6)}`;
    if (cleanVk.startsWith('https://vk.com/')) {
      cleanVk = cleanVk.replace('https://vk.com/', '');
    }

    // Double-check guaranteed unique ID right at submission time
    const assignedId = generateUniqueParticipantId(role, allParticipants);
    const assignedPin = pinCode.trim() || generateRandomPin();

    const newParticipant: Participant = {
      id: assignedId,
      name: name.trim(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      vkId: cleanVk,
      vkUrl: `https://vk.com/${cleanVk}`,
      role,
      groupId: role === 'actor' ? (targetGroupId === 'bench' ? null : targetGroupId) : (targetGroupId === 'bench' ? null : targetGroupId),
      preferredWithIds: preferredId ? [preferredId] : [],
      avoidedWithIds: [],
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      notes: notes.trim(),
      pinCode: assignedPin,
    };

    setParticipantPin(assignedId, assignedPin);
    onAddParticipant(newParticipant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{role === 'actor' ? 'Добавить актёра' : 'Добавить участника'}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                {computedNextId}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                ФИО {role === 'actor' ? 'актёра / актрисы' : 'участника'}:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'actor' ? 'Алексей Смирнов' : 'Иван Смирнов'}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Роль в лаборатории:
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value as RoleType;
                  setRole(newRole);
                  if (newRole === 'actor') {
                    setTargetGroupId('bench');
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-medium"
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
                placeholder="smirnov_actor или id..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {role === 'actor' ? 'Закрепление за картиной:' : 'Назначить в группу:'}
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="bench">
                  {role === 'actor' ? 'Свободный график (Актёрский пул)' : 'Резерв (скамейка запасных)'}
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.projectTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Персональный PIN-код (4 цифры):</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Сгенерирован автоматически</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-emerald-400 font-mono font-bold tracking-widest focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setPinCode(generateRandomPin())}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1"
                title="Сгенерировать другой случайный PIN"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Случайный</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Особые умения (через запятую):</span>
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder={role === 'actor' ? 'Вокал, гитара, верховая езда, фехтование, права кат. B...' : 'Свет, стедикам, DaVinci, звук...'}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
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
                  {p.name} ({ROLES[p.role]?.shortTitle || p.role}) — {p.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Заметки:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={role === 'actor' ? 'Типаж, амплуа, опыт съёмок...' : 'Опыт, портфолио...'}
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-colors shadow"
            >
              {role === 'actor' ? 'Добавить актёра в пул' : 'Сохранить участника'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
