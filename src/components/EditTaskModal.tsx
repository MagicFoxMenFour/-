import React, { useState, useEffect } from 'react';
import { CheckSquare, X, Trash2 } from 'lucide-react';
import { FilmGroup, Participant, ProductionStage, RoleType, Task, TaskStatus } from '../types';
import { ROLES } from '../data/roles';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  groups: FilmGroup[];
  participants: Participant[];
  onSaveTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  groups,
  participants,
  onSaveTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [groupId, setGroupId] = useState(task?.groupId || (groups[0]?.id || ''));
  const [assignedToId, setAssignedToId] = useState(task?.assignedToId || '');
  const [role, setRole] = useState<RoleType>(task?.role || 'director');
  const [stage, setStage] = useState<ProductionStage>(task?.stage || 'pre_production');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [deliverableUrl, setDeliverableUrl] = useState(task?.deliverableUrl || '');
  const [deliverableNotes, setDeliverableNotes] = useState(task?.deliverableNotes || '');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setGroupId(task.groupId);
      setAssignedToId(task.assignedToId);
      setRole(task.role);
      setStage(task.stage);
      setStatus(task.status);
      setDeadline(task.deadline);
      setDeliverableUrl(task.deliverableUrl || '');
      setDeliverableNotes(task.deliverableNotes || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const groupMembers = participants.filter((p) => p.groupId === groupId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTask({
      ...task,
      title: title.trim() || task.title,
      description: description.trim() || task.description,
      groupId,
      assignedToId,
      role,
      stage,
      status,
      deadline,
      deliverableUrl: deliverableUrl.trim() || undefined,
      deliverableNotes: deliverableNotes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Редактирование задачи
              </h3>
              <p className="text-xs text-zinc-400">
                Изменение сроков, исполнителя, описания и материалов
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
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Название задачи:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Техническое задание / Описание:
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-zinc-500 leading-relaxed font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Съёмочная группа:
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Ответственный исполнитель:
              </label>
              <select
                value={assignedToId}
                onChange={(e) => {
                  setAssignedToId(e.target.value);
                  const mem = participants.find((p) => p.id === e.target.value);
                  if (mem) setRole(mem.role);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              >
                {(groupMembers.length > 0 ? groupMembers : participants).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({ROLES[p.role].shortTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Статус:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="todo">К выполнению</option>
                <option value="in_progress">В процессе</option>
                <option value="review">На проверке</option>
                <option value="done">Выполнено</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Этап:
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProductionStage)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="development">Девелопмент</option>
                <option value="pre_production">Пре-продакшн</option>
                <option value="production">Съёмки</option>
                <option value="post_production">Пост-продакшн</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Дедлайн:
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Ссылка на готовый материал:
              </label>
              <input
                type="url"
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                placeholder="https://docs.google.com/... или диск"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Заметки / версия материала:
              </label>
              <input
                type="text"
                value={deliverableNotes}
                onChange={(e) => setDeliverableNotes(e.target.value)}
                placeholder="Драфт №2, согласовано"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/80 p-1.5 rounded-xl text-xs">
                <span className="text-red-300 font-medium px-2">Удалить задачу?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTask(task.id);
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
                <span>Удалить задачу</span>
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
