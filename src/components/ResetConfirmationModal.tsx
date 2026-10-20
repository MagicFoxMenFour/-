import React from 'react';
import { AlertTriangle, RotateCcw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupsCount: number;
  participantsCount: number;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  groupsCount,
  participantsCount,
}) => {
  const [confirmText, setConfirmText] = React.useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5 text-zinc-100">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/40">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Сброс к исходным данным?
              </h3>
              <span className="text-[11px] font-semibold text-rose-300 bg-rose-950/60 border border-rose-900/80 px-2 py-0.5 rounded-full inline-block mt-1">
                Требуются права Администратора
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-850 space-y-2.5 text-xs text-zinc-300">
          <div className="flex items-start gap-2 text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              Вы собираетесь восстановить эталонное состояние кинолаборатории:
            </p>
          </div>

          <ul className="space-y-1.5 pl-6 list-disc text-zinc-400 text-[11px] leading-relaxed">
            <li>
              Все <strong className="text-zinc-200">7 съёмочных групп</strong> и их закреплённые составы ({participantsCount} участников) вернутся к начальным значениям.
            </li>
            <li>
              Все ручные перемещения участников между картинами будут отменены.
            </li>
            <li>
              Производственные задачи и прикреплённые материалы вернутся к исходным планам.
            </li>
            <li>
              Облачная база Firestore и локальные копии мгновенно синхронизируются.
            </li>
          </ul>
        </div>

        {/* Confirmation input guard */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300">
            Для подтверждения сброса введите слово <span className="text-rose-400 font-mono font-bold bg-rose-950 px-1.5 py-0.5 rounded border border-rose-900">СБРОСИТЬ</span>:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Введите СБРОСИТЬ..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition-colors text-center"
          >
            Отмена (Сохранить изменения)
          </button>

          <button
            type="button"
            disabled={confirmText.trim() !== 'СБРОСИТЬ'}
            onClick={() => {
              onConfirm();
              setConfirmText('');
            }}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              confirmText.trim() === 'СБРОСИТЬ'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Да, сбросить всё</span>
          </button>
        </div>
      </div>
    </div>
  );
};
