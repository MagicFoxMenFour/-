import React, { useState, useEffect } from 'react';
import { Film, X, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { FilmGroup, Participant, ProductionStage } from '../types';
import { ROLES } from '../data/roles';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: FilmGroup | null;
  participants: Participant[];
  onSaveGroup: (updatedGroup: FilmGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onMoveParticipant: (participantId: string, newGroupId: string | null) => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  participants,
  onSaveGroup,
  onDeleteGroup,
  onMoveParticipant,
}) => {
  const [name, setName] = useState(group?.name || '');
  const [projectTitle, setProjectTitle] = useState(group?.projectTitle || '');
  const [genre, setGenre] = useState(group?.genre || '');
  const [stage, setStage] = useState<ProductionStage>(group?.stage || 'development');
  const [logline, setLogline] = useState(group?.logline || '');
  const [vkChatUrl, setVkChatUrl] = useState(group?.vkChatUrl || '');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [copiedVkIds, setCopiedVkIds] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setProjectTitle(group.projectTitle);
      setGenre(group.genre);
      setStage(group.stage);
      setLogline(group.logline);
      setVkChatUrl(group.vkChatUrl || '');
    }
  }, [group]);

  if (!isOpen || !group) return null;

  const groupMembers = participants.filter((p) => p.groupId === group.id);
  const benchMembers = participants.filter((p) => !p.groupId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGroup({
      ...group,
      name: name.trim() || group.name,
      projectTitle: projectTitle.trim() || group.projectTitle,
      genre: genre.trim() || group.genre,
      stage,
      logline: logline.trim() || group.logline,
      vkChatUrl: vkChatUrl.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Редактирование: {group.name}
              </h3>
              <p className="text-xs text-zinc-400">
                Изменение названия группы, кинопроекта, логлайна и состава
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Название съёмочной группы:
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
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Рабочее название проекта:
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Жанр картины:
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Этап производства:
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProductionStage)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="development">Девелопмент</option>
                <option value="pre_production">Пре-продакшн</option>
                <option value="production">Съёмочный период</option>
                <option value="post_production">Пост-продакшн</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Логлайн фильма:
            </label>
            <textarea
              rows={3}
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="Краткое описание драматургии и завязки истории..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-zinc-500 leading-relaxed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Ссылка на общую беседу съёмочной группы в VK (vk.me/join/...):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ids = groupMembers.map((m) => m.vkId).join(', ');
                    navigator.clipboard.writeText(ids);
                    setCopiedVkIds(true);
                    setTimeout(() => setCopiedVkIds(false), 2000);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white underline transition-colors"
                >
                  {copiedVkIds ? 'ID скопированы!' : 'Скопировать VK ID'}
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={() => setVkChatUrl(`https://vk.me/join/cinelab_group_${group.number}`)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  Шаблон ссылки
                </button>
              </div>
            </div>
            <input
              type="url"
              value={vkChatUrl}
              onChange={(e) => setVkChatUrl(e.target.value)}
              placeholder="https://vk.me/join/AJQ1d... или ссылка на чат"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Участники группы смогут переходить в общую беседу прямо из личных кабинетов.
            </p>
          </div>

          {/* Members in group */}
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Состав группы ({groupMembers.length} человек):
              </span>
              {benchMembers.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onMoveParticipant(e.target.value, group.id);
                    }
                  }}
                  className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                >
                  <option value="" disabled>
                    + Добавить из резерва ({benchMembers.length})
                  </option>
                  {benchMembers.map((bm) => (
                    <option key={bm.id} value={bm.id}>
                      {bm.name} ({ROLES[bm.role].shortTitle})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {groupMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono text-zinc-400">{m.id}</span>
                    <span className="text-sm font-medium text-white">{m.name}</span>
                    <span className="text-xs text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {ROLES[m.role].shortTitle}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onMoveParticipant(m.id, null)}
                    title="Переместить в резерв"
                    className="p-1 text-zinc-400 hover:text-red-400 transition-colors rounded"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/80 p-1.5 rounded-xl text-xs">
                <span className="text-red-300 font-medium px-2">Расформировать?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteGroup(group.id);
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
                <span>Расформировать группу</span>
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
                Сохранить изменения
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
