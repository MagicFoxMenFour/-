import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  CheckSquare,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
} from 'lucide-react';
import { FilmGroup, Participant, Task } from '../types';
import {
  createGoogleDocPassport,
  createGoogleSheetRoster,
  syncToGoogleTasks,
  WorkspaceExportResult,
} from '../services/googleWorkspace';
import { getAccessToken, googleSignIn } from '../services/auth';
import { User } from 'firebase/auth';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: FilmGroup[];
  participants: Participant[];
  tasks: Task[];
  googleUser: User | null;
  onGoogleSignIn: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  groups,
  participants,
  tasks,
  googleUser,
  onGoogleSignIn,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [result, setResult] = useState<WorkspaceExportResult | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<'sheets' | 'docs' | 'tasks' | null>(null);

  if (!isOpen) return null;

  // Execute Sheets Export with user confirmation
  const handleConfirmSheets = async () => {
    setLoadingAction('sheets');
    setConfirmingAction(null);
    setResult(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const signResult = await googleSignIn();
        token = signResult?.accessToken || null;
      }

      if (!token) {
        throw new Error('Требуется авторизация в Google аккаунте');
      }

      const res = await createGoogleSheetRoster(groups, participants, tasks, token);
      setResult(res);
    } catch (e: any) {
      setResult({
        success: false,
        type: 'sheets',
        title: 'Ошибка экспорта',
        error: e.message || 'Не удалось выполнить экспорт в Google Sheets',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Execute Docs Export with user confirmation
  const handleConfirmDocs = async () => {
    setLoadingAction('docs');
    setConfirmingAction(null);
    setResult(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const signResult = await googleSignIn();
        token = signResult?.accessToken || null;
      }

      if (!token) {
        throw new Error('Требуется авторизация в Google аккаунте');
      }

      const res = await createGoogleDocPassport(groups, participants, tasks, token);
      setResult(res);
    } catch (e: any) {
      setResult({
        success: false,
        type: 'docs',
        title: 'Ошибка экспорта',
        error: e.message || 'Не удалось сформировать Google Docs',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Execute Tasks Sync with user confirmation
  const handleConfirmTasks = async () => {
    setLoadingAction('tasks');
    setConfirmingAction(null);
    setResult(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const signResult = await googleSignIn();
        token = signResult?.accessToken || null;
      }

      if (!token) {
        throw new Error('Требуется авторизация в Google аккаунте');
      }

      const res = await syncToGoogleTasks(tasks, participants, groups, token);
      setResult(res);
    } catch (e: any) {
      setResult({
        success: false,
        type: 'tasks',
        title: 'Ошибка синхронизации',
        error: e.message || 'Не удалось синхронизировать Google Задачи',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Синхронизация Google Workspace
              </h3>
              <p className="text-xs text-zinc-400">
                Экспорт съёмочных матриц в Sheets, паспортов в Docs и графиков смен в Tasks
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

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* User auth state reminder */}
          {!googleUser && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-300">
                Для сохранения файлов в ваш Google Диск необходимо войти в аккаунт Google.
              </div>
              <button
                onClick={onGoogleSignIn}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shrink-0 shadow"
              >
                Войти в Google
              </button>
            </div>
          )}

          {/* Action Result Notification */}
          {result && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                result.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/30 border-red-500/40 text-red-200'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{result.title}</div>
                {result.error && (
                  <div className="text-xs text-red-300 mt-1">{result.error}</div>
                )}
                {result.url && (
                  <div className="mt-2">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs shadow hover:bg-emerald-400 transition-colors"
                    >
                      <span>Открыть созданный файл</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Explicit User Confirmation Dialog (MANDATORY REQUIREMENT) */}
          {confirmingAction && (
            <div className="p-5 rounded-xl bg-zinc-950 border-2 border-amber-500/50 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Подтверждение создания и записи в Google Workspace</span>
              </div>
              <p className="text-xs text-zinc-300">
                {confirmingAction === 'sheets' &&
                  `Вы подтверждаете создание новой таблицы в Google Sheets с экспортом ${groups.length} съёмочных групп, ${participants.length} участников и ${tasks.length} задач?`}
                {confirmingAction === 'docs' &&
                  `Вы подтверждаете генерацию производственного паспорта в Google Docs для всех ${groups.length} кинопроектов лаборатории?`}
                {confirmingAction === 'tasks' &&
                  `Вы подтверждаете создание списка задач «Кинолаборатория: Съёмочный план» в Google Tasks и выгрузку ${tasks.length} текущих задач?`}
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmingAction(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    if (confirmingAction === 'sheets') handleConfirmSheets();
                    if (confirmingAction === 'docs') handleConfirmDocs();
                    if (confirmingAction === 'tasks') handleConfirmTasks();
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold shadow"
                >
                  Да, подтверждаю экспорт
                </button>
              </div>
            </div>
          )}

          {/* Cards for each Google Workspace Tool */}
          <div className="grid grid-cols-1 gap-3.5">
            {/* Google Sheets Card */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google Sheets (Таблицы)</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Создать структурированную Google Таблицу с составами групп, ролями, контактами VK и списком задач.
                  </p>
                </div>
              </div>
              <button
                disabled={loadingAction !== null}
                onClick={() => setConfirmingAction('sheets')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
              >
                {loadingAction === 'sheets' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Экспорт в Sheets</span>
                )}
              </button>
            </div>

            {/* Google Docs Card */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google Docs (Документы)</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Сгенерировать официальный производственный паспорт проектов с синопсисами, логлайнами и съёмочными бригадами.
                  </p>
                </div>
              </div>
              <button
                disabled={loadingAction !== null}
                onClick={() => setConfirmingAction('docs')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
              >
                {loadingAction === 'docs' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Создать в Docs</span>
                )}
              </button>
            </div>

            {/* Google Tasks Card */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google Tasks (Задачи)</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Синхронизировать съёмочные дедлайны ({tasks.length} задач) в персональный список Google Tasks.
                  </p>
                </div>
              </div>
              <button
                disabled={loadingAction !== null}
                onClick={() => setConfirmingAction('tasks')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
              >
                {loadingAction === 'tasks' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Выгрузить в Tasks</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
