import React from 'react';
import { AlertCircle, ChevronRight, Sparkles, CheckCircle2, Ban } from 'lucide-react';
import { ConflictItem } from '../types';

interface ConflictAlertBannerProps {
  conflicts: ConflictItem[];
  onOpenModal: () => void;
  onAutoBalance: () => void;
}

export const ConflictAlertBanner: React.FC<ConflictAlertBannerProps> = ({
  conflicts,
  onOpenModal,
  onAutoBalance,
}) => {
  if (conflicts.length === 0) return null;

  const avoidConflicts = conflicts.filter((c) => c.type === 'avoided_partner_conflict');
  const roleConflicts = conflicts.filter((c) => c.type !== 'avoided_partner_conflict');

  const hasCriticalAvoid = avoidConflicts.length > 0;

  return (
    <div
      className={`border-b text-xs transition-colors ${
        hasCriticalAvoid
          ? 'bg-rose-950/70 border-rose-800 text-rose-200'
          : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
      }`}
    >
      <div className="max-w-[1800px] 2xl:max-w-[2100px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            {hasCriticalAvoid ? (
              <Ban className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              {hasCriticalAvoid ? (
                <>
                  <span className="font-bold text-rose-100">
                    Внимание: несовместимость по стоп-листу ({avoidConflicts.length})!
                  </span>{' '}
                  <span className="text-rose-200">
                    Участники, которые не хотят работать вместе, попали в одну съёмочную группу.
                  </span>
                  <span className="text-rose-300/80 hidden md:inline ml-2">
                    ({avoidConflicts[0]?.message})
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-zinc-200">
                    Мониторинг лаборатории:
                  </span>{' '}
                  <span className="text-emerald-300 font-medium mr-1.5">
                    ✓ Стоп-листы чисты (0 несовместимостей).
                  </span>
                  <span>
                    Есть {roleConflicts.length} рекомендаций по ролям и пожеланиям.
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onAutoBalance}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                hasCriticalAvoid
                  ? 'bg-rose-900 hover:bg-rose-850 text-rose-100 border border-rose-700'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-zinc-300" />
              <span>Авто-разрешение</span>
            </button>
            <button
              onClick={onOpenModal}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                hasCriticalAvoid
                  ? 'bg-rose-100 hover:bg-white text-rose-950 font-bold'
                  : 'bg-zinc-100 hover:bg-white text-zinc-950 font-medium'
              }`}
            >
              <span>Подробнее</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

