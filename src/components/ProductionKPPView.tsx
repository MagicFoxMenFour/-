import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Plus,
  Filter,
  UserCheck,
  Film,
  Users,
  Sparkles,
  Edit2,
  ArrowUpRight,
  FileText,
  Video,
  Clapperboard,
  Scissors,
  Check,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { FilmGroup, Participant, Task, TaskStatus, ProductionStage } from '../types';
import { ROLES } from '../data/roles';

interface ProductionKPPViewProps {
  groups: FilmGroup[];
  participants: Participant[];
  tasks: Task[];
  isAdmin: boolean;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateTaskDetails?: (task: Task) => void;
  onUpdateGroupStage?: (groupId: string, newStage: ProductionStage) => void;
  onOpenAddTaskModal: (initialGroupId?: string) => void;
  onClearKPP?: () => void;
  onSelectMemberForCabinet: (participant: Participant) => void;
  showToast: (msg: string) => void;
}

const STAGE_LABELS: Record<ProductionStage, { label: string; color: string; desc: string }> = {
  development: {
    label: 'Девелопмент',
    color: 'border-amber-500/30 text-amber-400 bg-amber-950/20',
    desc: 'Литературный тритмент, драфт сценария и экспозиция пилота'
  },
  pre_production: {
    label: 'Препродакшн',
    color: 'border-sky-500/30 text-sky-400 bg-sky-950/20',
    desc: 'Режиссёрская экспликация, раскадровки, КПП и кастинг'
  },
  production: {
    label: 'Съёмочный период',
    color: 'border-purple-500/30 text-purple-400 bg-purple-950/20',
    desc: 'Съёмочные смены, работа на площадке, операторский блокинг'
  },
  post_production: {
    label: 'Постпродакшн',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
    desc: 'Монтаж, цветокоррекция, саунд-дизайн и сдача чистового пилота'
  }
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; textClass: string; bgClass: string; icon: any }> = {
  todo: {
    label: 'К выполнению',
    textClass: 'text-zinc-400',
    bgClass: 'bg-zinc-800/80 border-zinc-700',
    icon: Clock
  },
  in_progress: {
    label: 'В работе',
    textClass: 'text-amber-300',
    bgClass: 'bg-amber-950/50 border-amber-800/70',
    icon: Clock
  },
  review: {
    label: 'На проверке',
    textClass: 'text-purple-300',
    bgClass: 'bg-purple-950/50 border-purple-800/70',
    icon: AlertCircle
  },
  done: {
    label: 'Принято / Сдано',
    textClass: 'text-emerald-300',
    bgClass: 'bg-emerald-950/50 border-emerald-800/70',
    icon: CheckCircle2
  }
};

export const ProductionKPPView: React.FC<ProductionKPPViewProps> = ({
  groups,
  participants,
  tasks,
  isAdmin,
  onUpdateTaskStatus,
  onUpdateTaskDetails,
  onUpdateGroupStage,
  onOpenAddTaskModal,
  onClearKPP,
  onSelectMemberForCabinet,
  showToast
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDeliverableTaskId, setEditingDeliverableTaskId] = useState<string | null>(null);
  const [deliverableInputUrl, setDeliverableInputUrl] = useState('');
  const [deliverableInputNotes, setDeliverableInputNotes] = useState('');
  const [showActorsCastingDrawer, setShowActorsCastingDrawer] = useState(false);

  // Filter groups
  const sortedGroups = [...groups].sort((a, b) => (a.number || 0) - (b.number || 0));
  const displayedGroups = selectedGroupFilter === 'all'
    ? sortedGroups
    : sortedGroups.filter(g => g.id === selectedGroupFilter);

  // Actors in reserve (14 actors)
  const actorsInReserve = participants.filter(p => p.role === 'actor' && !p.isDeleted);

  // Overall statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const overallProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Handle stage update
  const handleStageChange = (group: FilmGroup, newStage: ProductionStage) => {
    if (!isAdmin) {
      showToast('Только администратор или куратор может переключать производственные стадии');
      return;
    }
    if (onUpdateGroupStage) {
      onUpdateGroupStage(group.id, newStage);
      showToast(`Стадия группы «${group.name}» изменена на «${STAGE_LABELS[newStage].label}»`);
    }
  };

  // Handle deliverable save
  const handleSaveDeliverable = (task: Task) => {
    if (onUpdateTaskDetails) {
      const updated: Task = {
        ...task,
        deliverableUrl: deliverableInputUrl.trim() || undefined,
        deliverableNotes: deliverableInputNotes.trim() || undefined,
        status: deliverableInputUrl.trim() ? 'review' : task.status
      };
      onUpdateTaskDetails(updated);
      showToast('Материал этапа сохранен и направлен на проверку');
    }
    setEditingDeliverableTaskId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Единый Календарно-Постановочный План (КПП)</span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400 font-mono">5 съёмочных групп</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              График производства пилотных серий
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
              Сквозной контроль дедлайнов, этапов сценарного девелопмента, экспликаций, кастинга и сдачи чистового монтажа пилотов кинолаборатории.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowActorsCastingDrawer(!showActorsCastingDrawer)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                showActorsCastingDrawer
                  ? 'bg-purple-950/80 border-purple-800 text-purple-300'
                  : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
              }`}
              title="Открыть реестр 14 актёров в резерве для проб и утверждения на роли"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Кастинг-пул ({actorsInReserve.length} актёров)</span>
            </button>

            {isAdmin && (
              <div className="flex items-center gap-2">
                {tasks.length > 0 && onClearKPP && (
                  <button
                    onClick={() => {
                      if (confirm('Вы уверены, что хотите полностью очистить все задачи в Производственном КПП?')) {
                        onClearKPP();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-850 hover:bg-rose-950/60 hover:text-rose-300 border border-zinc-750 hover:border-rose-700/60 text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
                    title="Полностью очистить список задач КПП"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Очистить КПП</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenAddTaskModal(selectedGroupFilter !== 'all' ? selectedGroupFilter : undefined)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить задачу в КПП</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Progress Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-lg">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Готовность лаборатории
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {overallProgress}%
              </span>
              <span className="text-xs text-zinc-500">
                ({completedTasksCount} из {totalTasksCount} задач)
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-lg">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              В работе цехов
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-1 tabular-nums">
              {inProgressCount}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              активные съёмки и разработка
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-lg">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              На проверке куратора
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300 mt-1 tabular-nums">
              {reviewCount}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              ждут утверждения экспликаций
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-lg">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Сдано и принято
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              {completedTasksCount}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              утверждённые этапы пилотов
            </div>
          </div>
        </div>
      </div>

      {/* Actors Casting Drawer (Expandable) */}
      {showActorsCastingDrawer && (
        <div className="bg-zinc-900 border border-purple-900/60 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Резерв актёрского цеха для кастинга пилотов ({actorsInReserve.length} актёров)
              </h3>
            </div>
            <button
              onClick={() => setShowActorsCastingDrawer(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Свернуть
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Актёры сохраняются в общем резерве кинолаборатории. Съёмочные группы могут приглашать их на пробы и закреплять за персонажами своих пилотных серий.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2">
            {actorsInReserve.map((actor) => (
              <div
                key={actor.id}
                onClick={() => onSelectMemberForCabinet(actor)}
                className="flex items-center gap-2.5 p-2.5 bg-zinc-950/70 hover:bg-zinc-850 border border-zinc-800 rounded-lg cursor-pointer transition-colors group"
              >
                <img
                  src={actor.avatar}
                  alt={actor.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-purple-700/40"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300 truncate transition-colors">
                    {actor.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    PIN: <span className="font-mono text-emerald-400 font-semibold">{actor.pinCode || '1234'}</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedGroupFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              selectedGroupFilter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            Все 5 групп
          </button>
          {sortedGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupFilter(g.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedGroupFilter === g.id
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <span>{g.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Все стадии производства</option>
            <option value="development">Девелопмент</option>
            <option value="pre_production">Препродакшн</option>
            <option value="production">Съёмочный период</option>
            <option value="post_production">Постпродакшн</option>
          </select>
        </div>
      </div>

      {/* Production KPP Schedule Grid by Groups */}
      <div className="space-y-6">
        {displayedGroups.map((group) => {
          const groupTasks = tasks.filter((t) => t.groupId === group.id);
          const groupMembers = participants.filter((p) => p.groupId === group.id && !p.isDeleted);
          const director = groupMembers.find((p) => p.role === 'director');
          const producer = groupMembers.find((p) => p.role === 'producer');
          const dop = groupMembers.find((p) => p.role === 'dop');

          const completedCount = groupTasks.filter((t) => t.status === 'done').length;
          const progressPercent = groupTasks.length > 0 ? Math.round((completedCount / groupTasks.length) * 100) : 0;

          // Filter by stage if selected
          const activeTasks = selectedStageFilter === 'all'
            ? groupTasks
            : groupTasks.filter((t) => t.stage === selectedStageFilter);

          return (
            <div
              key={group.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:border-zinc-700 transition-colors"
            >
              {/* Group Card Header */}
              <div className="p-4 sm:p-5 bg-zinc-900/90 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-amber-400 uppercase tracking-wider">
                      {group.name}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-300 font-semibold">
                      «{group.projectTitle}»
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400">{group.genre}</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 max-w-2xl">
                    {group.logline}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-400">
                    <span>
                      Режиссёр:{' '}
                      <strong className="text-zinc-200">
                        {director ? director.name : 'Не назначен'}
                      </strong>
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span>
                      Оператор:{' '}
                      <strong className="text-zinc-200">
                        {dop ? dop.name : 'Не назначен'}
                      </strong>
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span>
                      Продюсер:{' '}
                      <strong className="text-zinc-200">
                        {producer ? producer.name : 'Не назначен'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Group Stage & Progress Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                  {/* Stage Switcher */}
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                      Текущая фаза:
                    </span>
                    {isAdmin ? (
                      <select
                        value={group.stage}
                        onChange={(e) => handleStageChange(group, e.target.value as ProductionStage)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:outline-none cursor-pointer ${
                          STAGE_LABELS[group.stage]?.color || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        <option value="development">1. Девелопмент</option>
                        <option value="pre_production">2. Препродакшн</option>
                        <option value="production">3. Съёмочный период</option>
                        <option value="post_production">4. Постпродакшн</option>
                      </select>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${STAGE_LABELS[group.stage]?.color}`}>
                        {STAGE_LABELS[group.stage]?.label}
                      </span>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="w-32">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                      <span>Готовность</span>
                      <span className="text-white font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks and Deliverables List */}
              <div className="divide-y divide-zinc-800/80">
                {activeTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-400">
                    Для выбранной стадии нет задач в КПП. Нажмите «Добавить задачу в КПП», чтобы запланировать новый этап.
                  </div>
                ) : (
                  activeTasks.map((task) => {
                    const assignee = participants.find((p) => p.id === task.assignedToId);
                    const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                    const StatusIcon = statusCfg.icon;
                    const isDeliverableEditing = editingDeliverableTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className="p-4 hover:bg-zinc-850/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">
                              {task.title}
                            </span>
                            <span className="text-zinc-600">·</span>
                            <span className="text-amber-400 font-medium">
                              {ROLES[task.role]?.title || task.role}
                            </span>
                            <span className="text-zinc-600">·</span>
                            <span className="text-zinc-400 font-mono text-[11px]">
                              Дедлайн: {task.deadline || 'Без дедлайна'}
                            </span>
                          </div>

                          <p className="text-zinc-400 text-xs line-clamp-2 max-w-3xl">
                            {task.description}
                          </p>

                          {/* Deliverable Notes or Link */}
                          {(task.deliverableUrl || task.deliverableNotes) && (
                            <div className="flex items-center gap-2 text-xs pt-0.5">
                              {task.deliverableUrl && (
                                <a
                                  href={task.deliverableUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-medium"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Сданный материал / Ссылка</span>
                                </a>
                              )}
                              {task.deliverableNotes && (
                                <span className="text-zinc-400 italic">
                                  — «{task.deliverableNotes}»
                                </span>
                              )}
                            </div>
                          )}

                          {/* Edit deliverable input box */}
                          {isDeliverableEditing && (
                            <div className="mt-2 p-3 bg-zinc-950 border border-zinc-700 rounded-lg space-y-2">
                              <div className="font-semibold text-zinc-300 text-xs">
                                Прикрепить ссылку на сданный материал:
                              </div>
                              <input
                                type="url"
                                placeholder="Ссылка на Google Docs / Яндекс.Диск / Видео"
                                value={deliverableInputUrl}
                                onChange={(e) => setDeliverableInputUrl(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                              <input
                                type="text"
                                placeholder="Комментарий к сдаче (например, 'Драфт сценария v2')"
                                value={deliverableInputNotes}
                                onChange={(e) => setDeliverableInputNotes(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleSaveDeliverable(task)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                                >
                                  Сохранить и отправить на проверку
                                </button>
                                <button
                                  onClick={() => setEditingDeliverableTaskId(null)}
                                  className="px-2.5 py-1 bg-zinc-800 text-zinc-400 hover:text-white rounded text-xs"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Assignee & Status controls */}
                        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                          {assignee ? (
                            <div
                              onClick={() => onSelectMemberForCabinet(assignee)}
                              className="flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
                              title="Открыть карточку исполнителя"
                            >
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-zinc-200 font-medium truncate max-w-[120px]">
                                {assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">Не назначен</span>
                          )}

                          {/* Action button to attach deliverable */}
                          {!isDeliverableEditing && (
                            <button
                              onClick={() => {
                                setEditingDeliverableTaskId(task.id);
                                setDeliverableInputUrl(task.deliverableUrl || '');
                                setDeliverableInputNotes(task.deliverableNotes || '');
                              }}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                              title="Прикрепить материал или ссылку"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Status Dropdown */}
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none transition-colors cursor-pointer ${statusCfg.bgClass} ${statusCfg.textClass}`}
                          >
                            <option value="todo">⚪ К выполнению</option>
                            <option value="in_progress">🟡 В работе</option>
                            <option value="review">🟣 На проверке</option>
                            <option value="done">🟢 Принято / Сдано</option>
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
