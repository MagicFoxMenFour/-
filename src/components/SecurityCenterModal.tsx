import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Trash2,
  History,
  Activity,
  X,
  RefreshCw,
  Plus,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Users,
  Check,
  AlertCircle
} from 'lucide-react';
import { DatabaseBackup, FilmGroup, Participant, Task } from '../types';
import {
  createDatabaseBackup,
  deleteBackupEntry,
  exportDatabaseToJsonFile,
  fetchBackupsList,
  runSystemDiagnostics,
  validateAndParseBackupJson,
  DiagnosticsReport,
} from '../services/backupService';
import { ROLES } from '../data/roles';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: FilmGroup[];
  participants: Participant[];
  tasks: Task[];
  isCloudSynced: boolean;
  onRestoreState: (restored: {
    groups: FilmGroup[];
    participants: Participant[];
    tasks: Task[];
    summary: string;
  }) => void;
  onRestoreParticipant: (participantId: string) => void;
  onPermanentDeleteParticipant: (participantId: string) => void;
  onAutoRepairOrphans: () => void;
  onGenerateMissingPins: () => void;
  onExecuteHardReset: (keepActors: boolean) => void;
  showToast: (msg: string) => void;
  initialTab?: 'diagnostics' | 'backups' | 'trash' | 'reset';
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
  groups,
  participants,
  tasks,
  isCloudSynced,
  onRestoreState,
  onRestoreParticipant,
  onPermanentDeleteParticipant,
  onAutoRepairOrphans,
  onGenerateMissingPins,
  onExecuteHardReset,
  showToast,
  initialTab = 'diagnostics',
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'backups' | 'trash' | 'reset'>(initialTab);
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [newBackupLabel, setNewBackupLabel] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [keepActorsOnReset, setKeepActorsOnReset] = useState(true);
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadBackups();
    }
  }, [isOpen, initialTab]);

  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const list = await fetchBackupsList();
      setBackups(list);
    } catch (e) {
      console.warn('Could not load backups list', e);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Run diagnostics report
  useEffect(() => {
    if (isOpen) {
      const r = runSystemDiagnostics(groups, participants, tasks, isCloudSynced, backups.length);
      setReport(r);
    }
  }, [isOpen, groups, participants, tasks, isCloudSynced, backups.length]);

  const handleManualScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const r = runSystemDiagnostics(groups, participants, tasks, isCloudSynced, backups.length);
      setReport(r);
      setIsScanning(false);
      showToast('Диагностика систем завершена: статус обновлен');
    }, 400);
  };

  const handleCreateManualBackup = async () => {
    if (isCreatingBackup) return;
    setIsCreatingBackup(true);
    const label = newBackupLabel.trim() || `Ручной снимок от ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    try {
      const created = await createDatabaseBackup(
        label,
        'manual',
        { groups, participants, tasks },
        'Главный продюсер (Куратор)'
      );
      setBackups((prev) => [created, ...prev]);
      setNewBackupLabel('');
      showToast('Резервная копия успешно создана в облаке');
    } catch (err) {
      showToast('Ошибка при создании резервной копии');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleApplyRestore = (backup: DatabaseBackup) => {
    onRestoreState({
      groups: backup.data.groups,
      participants: backup.data.participants,
      tasks: backup.data.tasks,
      summary: `Восстановлен снимок «${backup.label}» (${new Date(backup.timestamp).toLocaleString('ru-RU')})`,
    });
    setConfirmRestoreId(null);
    showToast(`База данных успешно возвращена к снимку «${backup.label}»`);
  };

  const handleDeleteBackup = async (id: string) => {
    await deleteBackupEntry(id);
    setBackups((prev) => prev.filter((b) => b.id !== id));
    showToast('Резервная копия удалена');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseBackupJson(content);
      if (!res.valid || !res.data) {
        showToast(res.error || 'Ошибка проверки файла');
        return;
      }

      // Auto save current snapshot before replacing
      await createDatabaseBackup(
        'Авто-снимок перед импортом из файла',
        'auto_snapshot',
        { groups, participants, tasks },
        'Система защиты'
      );

      onRestoreState({
        groups: res.data.groups,
        participants: res.data.participants,
        tasks: res.data.tasks,
        summary: `Импорт из внешнего файла «${file.name}»`,
      });
      showToast(`Успешно импортировано: ${res.data.groups.length} групп, ${res.data.participants.length} участников`);
      loadBackups();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  const trashedMembers = participants.filter((p) => p.isDeleted);
  const activeMembers = participants.filter((p) => !p.isDeleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in text-zinc-100">
      <div className="bg-zinc-900 border border-zinc-750 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-700/80 flex items-center justify-center text-amber-400 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-tight">
                  Центр безопасности и защита от сбоев
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  Защита 100%
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Авто-снимки, защита от случайного сброса, проверка целостности и корзина участников
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-800 bg-zinc-900/50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'diagnostics'
                ? 'border-amber-400 text-amber-300 bg-zinc-850/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Диагностика систем</span>
            {report?.overallStatus === 'ok' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
            {report?.overallStatus === 'error' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'backups'
                ? 'border-amber-400 text-amber-300 bg-zinc-850/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Точки восстановления ({backups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'trash'
                ? 'border-amber-400 text-amber-300 bg-zinc-850/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Корзина участников</span>
            {trashedMembers.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-rose-950 text-rose-300 border border-rose-800 rounded-full font-mono">
                {trashedMembers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl border-b-2 transition-colors ml-auto ${
              activeTab === 'reset'
                ? 'border-rose-500 text-rose-300 bg-zinc-850/80'
                : 'border-transparent text-zinc-400 hover:text-rose-400 hover:bg-zinc-850/40'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Сброс данных</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Общий статус защиты:
                    </span>
                    {report?.overallStatus === 'ok' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Все системы защищены и активны
                      </span>
                    ) : report?.overallStatus === 'warning' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" /> Внимание: требуются профилактические действия
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-1 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" /> Обнаружены несоответствия данных
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Проверены: Firestore, защита от авто-сброса, привязки участников, PIN-коды и резервные снимки.
                  </p>
                </div>

                <button
                  onClick={handleManualScan}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Повторить диагностику</span>
                </button>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Активных групп</span>
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {groups.length}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Производственные цеха
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Участников</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {activeMembers.length}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    В группах и Резерве
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Точек отката</span>
                    <History className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {backups.length}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Снимки в облаке и кэше
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>В Корзине</span>
                    <Trash2 className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {trashedMembers.length}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Сохранены для восстановления
                  </div>
                </div>
              </div>

              {/* Detailed Checks List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Результаты проверки контуров безопасности:
                </h4>

                <div className="space-y-2.5">
                  {report?.checks.map((check, idx) => {
                    const isOk = check.status === 'ok';
                    const isWarn = check.status === 'warning';
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isOk
                            ? 'bg-zinc-950/60 border-zinc-800'
                            : isWarn
                            ? 'bg-amber-950/20 border-amber-800/60'
                            : 'bg-rose-950/30 border-rose-800/70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            {isOk && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                            {!isOk && !isWarn && <AlertCircle className="w-4 h-4 text-rose-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{check.title}</span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-0.5">
                              {check.message}
                            </p>
                            {check.details && (
                              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                                {check.details}
                              </p>
                            )}
                          </div>
                        </div>

                        {check.actionable && (
                          <div className="shrink-0 self-end sm:self-center">
                            {check.title.includes('Потерянные привязки') && (
                              <button
                                onClick={onAutoRepairOrphans}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow"
                              >
                                {check.actionLabel}
                              </button>
                            )}
                            {check.title.includes('PIN-коды') && (
                              <button
                                onClick={onGenerateMissingPins}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow"
                              >
                                {check.actionLabel}
                              </button>
                            )}
                            {check.title.includes('Резервные копии') && (
                              <button
                                onClick={() => setActiveTab('backups')}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow"
                              >
                                {check.actionLabel}
                              </button>
                            )}
                            {check.title.includes('Корзина') && (
                              <button
                                onClick={() => setActiveTab('trash')}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors border border-zinc-700"
                              >
                                {check.actionLabel}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKUPS & SNAPSHOTS */}
          {activeTab === 'backups' && (
            <div className="space-y-6">
              {/* Quick Actions Header */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={newBackupLabel}
                    onChange={(e) => setNewBackupLabel(e.target.value)}
                    placeholder="Название точки восстановления (например: Перед съёмками сцены 3)..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleCreateManualBackup}
                    disabled={isCreatingBackup}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-md shadow-amber-950/40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Создать снимок сейчас</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-4 shrink-0">
                  <button
                    onClick={() => exportDatabaseToJsonFile(groups, participants, tasks)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-semibold transition-colors"
                    title="Скачать файл JSON с полной копией базы на компьютер"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Скачать .json</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Загрузить .json</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJsonFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Backups List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Сохранённые точки восстановления ({backups.length}):
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Любой снимок восстанавливает все группы, составы и задачи в 1 клик
                  </span>
                </div>

                {isLoadingBackups ? (
                  <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Загрузка списка резервных копий...</span>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                    <History className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="font-semibold text-zinc-300">
                      Резервных снимков ещё нет
                    </p>
                    <p className="text-zinc-500 max-w-sm mx-auto">
                      Нажмите кнопку «Создать снимок сейчас» выше, чтобы зафиксировать текущее состояние базы данных.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {backups.map((b) => {
                      const isConfirming = confirmRestoreId === b.id;
                      const dateObj = new Date(b.timestamp);
                      const formattedDate = dateObj.toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const formattedTime = dateObj.toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={b.id}
                          className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">
                                {b.label}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-400 border border-zinc-750">
                                {formattedDate}, {formattedTime}
                              </span>
                              {b.trigger === 'pre_reset' && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900">
                                  Перед сбросом
                                </span>
                              )}
                              {b.trigger === 'auto_snapshot' && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900">
                                  Авто-снимок
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                              <span>Групп: <strong className="text-zinc-200">{b.groupsCount}</strong></span>
                              <span>•</span>
                              <span>Участников: <strong className="text-zinc-200">{b.participantsCount}</strong></span>
                              <span>•</span>
                              <span>Задач: <strong className="text-zinc-200">{b.tasksCount}</strong></span>
                              <span>•</span>
                              <span className="text-zinc-500">{b.creator}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {isConfirming ? (
                              <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-amber-800 rounded-lg animate-fade-in">
                                <span className="text-[11px] text-amber-300 px-2 font-semibold">
                                  Точно откатить?
                                </span>
                                <button
                                  onClick={() => handleApplyRestore(b)}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold"
                                >
                                  Да, восстановить
                                </button>
                                <button
                                  onClick={() => setConfirmRestoreId(null)}
                                  className="px-2 py-1 text-zinc-400 hover:text-white text-xs"
                                >
                                  Отмена
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setConfirmRestoreId(b.id)}
                                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Откатить сюда</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteBackup(b.id)}
                                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                                  title="Удалить этот снимок"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TRASH (SOFT DELETE) */}
          {activeTab === 'trash' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300">
                  <p className="font-semibold text-white">
                    Защита от случайного удаления (Мягкое удаление)
                  </p>
                  <p className="text-zinc-400 mt-0.5 leading-relaxed">
                    Когда куратор удаляет участника, его профиль, PIN-код и личный кабинет НЕ уничтожаются. Они перемещаются в эту Корзину и могут быть возвращены обратно в Резерв в один клик.
                  </p>
                </div>
              </div>

              {trashedMembers.length === 0 ? (
                <div className="p-10 text-center bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-zinc-200">
                    Корзина пуста
                  </p>
                  <p className="text-zinc-500 max-w-sm mx-auto">
                    Все участники лаборатории активны и находятся в съёмочных группах либо на скамейке запасных (в Резерве).
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {trashedMembers.map((m) => {
                    const roleInfo = ROLES[m.role];
                    const delDate = m.deletedAt ? new Date(m.deletedAt).toLocaleString('ru-RU') : 'Недавно';

                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-700 bg-zinc-800"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {m.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-850 rounded text-zinc-400">
                                {m.id}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-zinc-850 text-zinc-300">
                                {roleInfo?.shortTitle || m.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              Удалён: {delDate} {m.deletedBy ? `(${m.deletedBy})` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onRestoreParticipant(m.id)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Восстановить в Резерв</span>
                          </button>

                          <button
                            onClick={() => onPermanentDeleteParticipant(m.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-850 rounded-lg transition-colors"
                            title="Стереть окончательно без возможности восстановления"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HARD RESET (FOOLPROOF DANGER ZONE) */}
          {activeTab === 'reset' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/80 space-y-3">
                <div className="flex items-center gap-2.5 text-rose-300">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <h4 className="text-sm font-bold">
                    Опасная операция: Сброс базы данных к эталону
                  </h4>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  Эта функция возвращает кинолабораторию к начальному виду (7 стандартных групп). Все созданные вами кастомные группы будут переформированы.
                </p>
                <div className="text-xs text-zinc-300 p-3 bg-zinc-950/80 rounded-lg border border-zinc-800 space-y-2">
                  <div className="font-semibold text-zinc-200">
                    🛡️ Встроенные гарантии безопасности системы:
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-[11px]">
                    <li>
                      Перед сбросом система <strong>автоматически создаст резервную копию</strong> в облаке. Вы всегда сможете вернуться назад одной кнопкой.
                    </li>
                    <li>
                      Случайное нажатие исключено: кнопка разблокируется только после ввода контрольной фразы.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepActorsOnReset}
                    onChange={(e) => setKeepActorsOnReset(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-0 focus:ring-offset-0"
                  />
                  <div>
                    <span className="font-bold text-white">
                      Сохранить добавленных актёров и участников (Рекомендуется)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Актёры и вручную созданные профили НЕ будут удалены — они сохранятся в Резерве лаборатории.
                    </p>
                  </div>
                </label>
              </div>

              {/* Confirmation Phrase Input */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Для подтверждения введите фразу <span className="font-mono text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80">СБРОСИТЬ БАЗУ</span>:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Введите СБРОСИТЬ БАЗУ..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-rose-500"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('diagnostics')}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                  >
                    Отмена
                  </button>

                  <button
                    type="button"
                    disabled={resetConfirmText.trim() !== 'СБРОСИТЬ БАЗУ'}
                    onClick={() => {
                      onExecuteHardReset(keepActorsOnReset);
                      setResetConfirmText('');
                      onClose();
                    }}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      resetConfirmText.trim() === 'СБРОСИТЬ БАЗУ'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Выполнить сброс с бэкапом</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Защита данных активна: облачная база синхронизирована</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
