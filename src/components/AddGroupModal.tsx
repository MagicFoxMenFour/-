import React, { useState } from 'react';
import { Film, X } from 'lucide-react';
import { FilmGroup, ProductionStage } from '../types';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextNumber: number;
  onAddGroup: (group: FilmGroup) => void;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({
  isOpen,
  onClose,
  nextNumber,
  onAddGroup,
}) => {
  const [name, setName] = useState(`Группа ${nextNumber}`);
  const [projectTitle, setProjectTitle] = useState('');
  const [genre, setGenre] = useState('Короткометражная драма');
  const [logline, setLogline] = useState('');
  const [stage, setStage] = useState<ProductionStage>('development');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectTitle.trim()) return;

    const newGroup: FilmGroup = {
      id: `grp-${Date.now()}`,
      number: nextNumber,
      name: name.trim(),
      projectTitle: projectTitle.trim(),
      genre: genre.trim(),
      logline: logline.trim() || 'Логлайн в разработке.',
      stage,
      color: 'zinc',
    };

    onAddGroup(newGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-zinc-200" />
            <h3 className="text-base font-bold text-white">
              Создать съёмочную группу
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
              Название съёмочной группы:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Группа 8"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Рабочее название фильма / проекта:
            </label>
            <input
              type="text"
              required
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Например: Встреча на рассвете"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Жанр:
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Триллер / Драма"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Стартовый этап:
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Логлайн:
            </label>
            <textarea
              rows={2}
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="Краткое описание сюжета..."
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
              Создать группу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
