import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { FilmGroup, Participant, ProductionStage, RoleType, Task } from '../types';
import { ROLES } from '../data/roles';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: FilmGroup[];
  participants: Participant[];
  onAddTask: (task: Task) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  groups,
  participants,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<string>(groups[0]?.id || '');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [role, setRole] = useState<RoleType>('director');
  const [stage, setStage] = useState<ProductionStage>('pre_production');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );

  if (!isOpen) return null;

  const groupMembers = participants.filter((p) => p.groupId === groupId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !groupId) return;

    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Выполнить задачу согласно регламенту кинолаборатории.',
      groupId,
      assignedToId: assignedToId || (groupMembers[0]?.id ?? participants[0]?.id ?? 'CINE-01'),
      role,
      stage,
      status: 'todo',
      deadline,
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-zinc-200" />
            <h3 className="text-base font-bold text-white">
              Создать задачу
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
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Название задачи:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Кастинг второго плана / Раскадровка / Сведение"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Описание / ТЗ:
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробности выполнения задачи..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-zinc-500 leading-relaxed font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Съёмочная группа:
              </label>
              <select
                value={groupId}
                onChange={(e) => {
                  setGroupId(e.target.value);
                  const firstInGroup = participants.find((p) => p.groupId === e.target.value);
                  if (firstInGroup) {
                    setAssignedToId(firstInGroup.id);
                    setRole(firstInGroup.role);
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Ответственный:
              </label>
              <select
                value={assignedToId}
                onChange={(e) => {
                  setAssignedToId(e.target.value);
                  const member = participants.find((p) => p.id === e.target.value);
                  if (member) setRole(member.role);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="">Выберите исполнителя</option>
                {(groupMembers.length > 0 ? groupMembers : participants).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({ROLES[p.role]?.shortTitle || p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Этап производства:
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProductionStage)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="development">Девелопмент</option>
                <option value="pre_production">Пре-продакшн</option>
                <option value="production">Съёмочный период</option>
                <option value="post_production">Пост-продакшн</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Дедлайн:
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
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
              Назначить задачу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
