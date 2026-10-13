import React, { useState, useMemo } from 'react';
import {
  X,
  Shield,
  Search,
  Filter,
  Download,
  Trash2,
  Clock,
  User,
  Users,
  Ban,
  CheckSquare,
  FileText,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { AuditLogEntry, AuditActionType } from '../types';
import { exportAuditLogsAsText } from '../services/auditLogger';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs?: AuditLogEntry[];
  onClearLogs: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs = [],
  onClearLogs,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | AuditActionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [hasRenderError, setHasRenderError] = useState(false);

  const safeLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    return logs.filter((l): l is AuditLogEntry => Boolean(l && typeof l === 'object'));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    try {
      const q = (searchQuery || '').trim().toLowerCase();

      return safeLogs.filter((log) => {
        if (!log || typeof log !== 'object') return false;
        const matchesFilter =
          activeFilter === 'all' ? true : log.actionType === activeFilter;

        const actor = String(log.actorName || '').toLowerCase();
        const title = String(log.targetTitle || '').toLowerCase();
        const details = String(log.details || '').toLowerCase();

        const matchesSearch =
          q === '' ||
          actor.includes(q) ||
          title.includes(q) ||
          details.includes(q);

        return matchesFilter && matchesSearch;
      });
    } catch (e) {
      console.error('Error filtering logs:', e);
      return safeLogs;
    }
  }, [safeLogs, activeFilter, searchQuery]);

  if (!isOpen) return null;

  const handleDownloadTxt = () => {
    try {
      const textContent = exportAuditLogsAsText();
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cinelab_audit_log_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download audit logs:', err);
    }
  };

  const getActionBadge = (type?: AuditActionType | string | null) => {
    switch (type) {
      case 'member_move':
        return {
          label: 'Составы',
          icon: Users,
          className: 'bg-blue-950/70 text-blue-300 border-blue-800',
        };
      case 'role_change':
        return {
          label: 'Смена роли',
          icon: User,
          className: 'bg-purple-950/70 text-purple-300 border-purple-800',
        };
      case 'stop_list_change':
        return {
          label: 'Стоп-лист',
          icon: Ban,
          className: 'bg-rose-950/70 text-rose-300 border-rose-800',
        };
      case 'task_change':
        return {
          label: 'Задачи',
          icon: CheckSquare,
          className: 'bg-amber-950/70 text-amber-300 border-amber-800',
        };
      case 'media_change':
        return {
          label: 'Медиатека',
          icon: FileText,
          className: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
        };
      case 'auto_balance':
        return {
          label: 'Авто-баланс',
          icon: Sparkles,
          className: 'bg-indigo-950/70 text-indigo-300 border-indigo-800',
        };
      case 'reset_data':
        return {
          label: 'Сброс',
          icon: RefreshCw,
          className: 'bg-red-950/70 text-red-300 border-red-800',
        };
      case 'group_change':
      default:
        return {
          label: 'Группа',
          icon: Shield,
          className: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  if (hasRenderError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Журнал аудита</h2>
          <p className="text-xs text-zinc-400">
            Возникла ошибка при чтении сохранённых записей. Вы можете сбросить повреждённый журнал или закрыть окно.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                onClearLogs();
                setHasRenderError(false);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
            >
              Очистить журнал
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Журнал аудита действий</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300 uppercase tracking-wider">
                  Лог событий куратора
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                История изменений составов, ролей, задач и материалов лаборатории
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTxt}
              title="Скачать журнал аудита в виде текстового файла"
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Скачать лог (.txt)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'all'
                  ? 'bg-zinc-200 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
              }`}
            >
              Все ({safeLogs.length})
            </button>
            <button
              onClick={() => setActiveFilter('member_move')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'member_move'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
              }`}
            >
              Составы
            </button>
            <button
              onClick={() => setActiveFilter('stop_list_change')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'stop_list_change'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
              }`}
            >
              Стоп-листы
            </button>
            <button
              onClick={() => setActiveFilter('task_change')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'task_change'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
              }`}
            >
              Задачи
            </button>
            <button
              onClick={() => setActiveFilter('media_change')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'media_change'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
              }`}
            >
              Медиатека
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск по журналу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Log Entries List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
              Записей в журнале по заданным критериям не найдено
            </div>
          ) : (
            filteredLogs.map((entry, idx) => {
              if (!entry || typeof entry !== 'object') return null;
              try {
                const badge = getActionBadge(entry.actionType);
                const IconComponent = (badge && typeof badge.icon === 'function') ? badge.icon : Shield;

                let formattedDate = '—';
                let formattedTime = '—';
                try {
                  if (entry.timestamp) {
                    let timeVal: any = entry.timestamp;
                    if (typeof entry.timestamp === 'object' && entry.timestamp !== null) {
                      const sec = (entry.timestamp as any).seconds;
                      if (typeof sec === 'number') {
                        timeVal = sec * 1000;
                      }
                    }
                    const dateObj = new Date(timeVal);
                    if (!isNaN(dateObj.getTime())) {
                      formattedDate = dateObj.toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      });
                      formattedTime = dateObj.toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });
                    }
                  }
                } catch {
                  formattedDate = '—';
                  formattedTime = '—';
                }

                const safeActor = typeof entry.actorName === 'string'
                  ? entry.actorName
                  : entry.actorName ? String(entry.actorName) : 'Пользователь';

                const safeTitle = typeof entry.targetTitle === 'string'
                  ? entry.targetTitle
                  : entry.targetTitle ? String(entry.targetTitle) : 'Объект';

                let safeDetails = '—';
                if (typeof entry.details === 'string') {
                  safeDetails = entry.details;
                } else if (entry.details) {
                  try {
                    safeDetails = JSON.stringify(entry.details);
                  } catch {
                    safeDetails = String(entry.details);
                  }
                }

                return (
                  <div
                    key={entry.id || `entry-${idx}`}
                    className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                        <IconComponent className="w-4 h-4 text-zinc-300" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge?.className || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
                          >
                            {badge?.label || 'Событие'}
                          </span>

                          <span className="font-semibold text-white truncate">
                            {safeTitle}
                          </span>

                          <span className="text-zinc-600">•</span>

                          <span className="text-zinc-400 font-medium">
                            {safeActor}
                          </span>
                        </div>

                        <p className="text-zinc-300 mt-1 leading-relaxed">
                          {safeDetails}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between text-right shrink-0 font-mono text-[11px] text-zinc-500 pl-11 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                      <span className="text-zinc-400 font-semibold">{formattedTime}</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                );
              } catch (err) {
                console.error('Error rendering audit log entry:', err);
                return null;
              }
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Всего событий в базе: <b className="text-zinc-300">{safeLogs.length}</b>
          </div>

          <div className="flex items-center gap-2">
            {isConfirmingClear ? (
              <div className="flex items-center gap-2 bg-zinc-850 border border-zinc-700 px-2 py-1 rounded-lg">
                <span className="text-xs text-rose-300">Очистить весь журнал?</span>
                <button
                  onClick={() => {
                    onClearLogs();
                    setIsConfirmingClear(false);
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
                >
                  Да, очистить
                </button>
                <button
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2 py-0.5 text-xs text-zinc-400 hover:text-white"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingClear(true)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить журнал</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
