import React, { useState } from 'react';
import {
  Clock,
  Plus,
  ExternalLink,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  FilmGroup,
  Participant,
  Task,
  TaskStatus,
} from '../types';
import { ROLES } from '../data/roles';

interface TasksDashboardProps {
  tasks: Task[];
  groups: FilmGroup[];
  participants: Participant[];
  isAdmin?: boolean;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onOpenNewTaskModal: () => void;
  onEditTask: (task: Task) => void;
  onSelectMemberForCabinet: (participant: Participant) => void;
}

export const TasksDashboard: React.FC<TasksDashboardProps> = ({
  tasks,
  groups,
  participants,
  isAdmin = true,
  onUpdateTaskStatus,
  onOpenNewTaskModal,
  onEditTask,
  onSelectMemberForCabinet,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Metrics
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const reviewTasks = tasks.filter((t) => t.status === 'review');
  const todoTasks = tasks.filter((t) => t.status === 'todo');

  const totalProgressPercent =
    totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesGroup =
      selectedGroupFilter === 'all' || t.groupId === selectedGroupFilter;
    const matchesStage =
      selectedStageFilter === 'all' || t.stage === selectedStageFilter;
    const assignee = participants.find((p) => p.id === t.assignedToId);
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assignee && assignee.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesGroup && matchesStage && matchesSearch;
  });

  const columns: { status: TaskStatus; title: string; count: number }[] = [
    {
      status: 'todo',
      title: 'К выполнению',
      count: filteredTasks.filter((t) => t.status === 'todo').length,
    },
    {
      status: 'in_progress',
      title: 'В процессе съёмок',
      count: filteredTasks.filter((t) => t.status === 'in_progress').length,
    },
    {
      status: 'review',
      title: 'На проверке куратора',
      count: filteredTasks.filter((t) => t.status === 'review').length,
    },
    {
      status: 'done',
      title: 'Выполнено / Сдано',
      count: filteredTasks.filter((t) => t.status === 'done').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="text-xs text-zinc-400 font-medium uppercase">
            Общий прогресс
          </div>
          <div className="text-2xl font-bold text-white font-mono my-1">
            {totalProgressPercent}%
          </div>
          <div className="text-xs text-zinc-400">
            {doneTasks.length} из {totalTasks} сдано
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs text-zinc-400">К выполнению</div>
          <div className="text-2xl font-bold text-zinc-200 font-mono mt-1">
            {todoTasks.length}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs text-zinc-400">В работе</div>
          <div className="text-2xl font-bold text-zinc-200 font-mono mt-1">
            {inProgressTasks.length}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs text-zinc-400">На проверке</div>
          <div className="text-2xl font-bold text-zinc-200 font-mono mt-1">
            {reviewTasks.length}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-xs text-zinc-400">Выполнено</div>
          <div className="text-2xl font-bold text-zinc-200 font-mono mt-1">
            {doneTasks.length}
          </div>
        </div>
      </div>

      {/* Filters and search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по задачам или исполнителям..."
              className="w-full bg-zinc-950 border border-zinc-700 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-500"
          >
            <option value="all">Все съёмочные группы</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-500"
          >
            <option value="all">Все этапы производства</option>
            <option value="development">Девелопмент</option>
            <option value="pre_production">Пре-продакшн</option>
            <option value="production">Съёмочный период</option>
            <option value="post_production">Пост-продакшн</option>
          </select>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs sm:text-sm rounded-lg transition-colors shrink-0 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Новая задача</span>
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);

          return (
            <div
              key={col.status}
              className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col"
            >
              {/* Header */}
              <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/60 rounded-t-xl flex items-center justify-between">
                <span className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
                  {col.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-800 text-zinc-400">
                  {col.count}
                </span>
              </div>

              {/* Tasks list */}
              <div className="p-3 space-y-3 flex-1 min-h-[350px] overflow-y-auto max-h-[600px]">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-center text-zinc-600 text-xs">
                    Нет задач
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const group = groups.find((g) => g.id === task.groupId);
                    const assignee = participants.find((p) => p.id === task.assignedToId);
                    const roleDef = ROLES[task.role];

                    return (
                      <div
                        key={task.id}
                        className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl space-y-2.5 transition-colors group"
                      >
                        {/* Title and Edit Button */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-white leading-snug">
                            {task.title}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => onEditTask(task)}
                              title="Редактировать задачу"
                              className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors shrink-0"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Group and Role info */}
                        <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {group?.name || 'Общая'}
                          </span>
                          <span>•</span>
                          <span className="text-zinc-400">
                            {roleDef?.shortTitle || task.role}
                          </span>
                        </div>

                        {/* Assignee & VK link */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-850">
                          {assignee ? (
                            <>
                              <button
                                onClick={() => onSelectMemberForCabinet(assignee)}
                                className="font-medium text-zinc-300 hover:underline truncate max-w-[150px] text-left"
                                title={`Ответственный: ${assignee.name}`}
                              >
                                {assignee.name}
                              </button>
                              <a
                                href={assignee.vkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-zinc-400 hover:text-white font-mono flex items-center gap-1"
                              >
                                <span>{assignee.vkId}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </>
                          ) : (
                            <span className="font-medium text-zinc-400 text-xs">Вся съёмочная группа</span>
                          )}
                        </div>

                        {/* Deliverable preview */}
                        {task.deliverableUrl && (
                          <div className="text-xs bg-zinc-900 p-2 rounded border border-zinc-800 flex items-center justify-between">
                            <span className="text-zinc-400 truncate max-w-[160px]">
                              {task.deliverableNotes || 'Материал прикреплен'}
                            </span>
                            <a
                              href={task.deliverableUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-zinc-200 hover:underline font-semibold flex items-center gap-1 shrink-0 ml-1"
                            >
                              <span>Открыть</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}

                        {/* Deadline & Status changer */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.deadline}</span>
                          </span>

                          <select
                            value={task.status}
                            onChange={(e) =>
                              onUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                            }
                            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded px-2 py-0.5 focus:outline-none"
                          >
                            <option value="todo">К выполнению</option>
                            <option value="in_progress">В процессе</option>
                            <option value="review">На проверке</option>
                            <option value="done">Выполнено</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
