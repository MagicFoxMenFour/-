import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Laptop,
  Copy,
  Check,
  ExternalLink,
  Cloud,
  CheckCircle2,
  X,
  Share2,
  UserCheck,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { Participant } from '../types';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloudSynced: boolean;
  appUrl: string;
  participants: Participant[];
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  isCloudSynced,
  appUrl,
  participants,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('curator');
  const [qrMode, setQrMode] = useState<'curator' | 'member'>('member');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isDevOrLocal =
    !currentOrigin ||
    currentOrigin.includes('localhost') ||
    currentOrigin.includes('127.0.0.1') ||
    currentOrigin.includes('ais-dev-');

  // If in production/deployed domain, use window.location.origin.
  // If in local/dev runner, use public shared appUrl so phones can connect.
  const baseOrigin = !isDevOrLocal
    ? currentOrigin
    : (appUrl || currentOrigin || 'https://ais-pre-ss3hwzlkhw3wsw6x5uczg5-492283559503.europe-west2.run.app');

  // Compute final URL depending on whether it's curator sync or specific participant portal
  const computedUrl = (() => {
    if (qrMode === 'curator' || selectedMemberId === 'curator') {
      return baseOrigin;
    }
    // Link directly to participant's personal cabinet
    return `${baseOrigin}?member=${encodeURIComponent(selectedMemberId)}`;
  })();

  // Robust offline client-side QR generation using canvas / data URL
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(
      computedUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        } else {
          console.error('QR code generation error:', err);
        }
      }
    );
  }, [isOpen, computedUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(computedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const selectedParticipant = participants.find((p) => p.id === selectedMemberId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative space-y-5 text-zinc-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200">
              <Share2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Подключение с телефона & QR-код для участников
              </h2>
              <p className="text-xs text-zinc-400">
                Синхронизация в реальном времени и персональный доступ в личный кабинет
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setQrMode('member');
              if (selectedMemberId === 'curator' && participants.length > 0) {
                setSelectedMemberId(participants[0].id);
              }
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              qrMode === 'member'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Для участника (Личный кабинет)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setQrMode('curator');
              setSelectedMemberId('curator');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              qrMode === 'curator'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Laptop className="w-4 h-4 text-blue-400" />
            <span>Для куратора (Полный доступ)</span>
          </button>
        </div>

        {/* Cloud Status */}
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <Cloud className="w-4 h-4 shrink-0" />
            <span>Облако Firestore активно: изменения синхронизируются мгновенно</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 font-mono text-[11px]">
            Live Sync
          </span>
        </div>

        {/* Member selector if member mode */}
        {qrMode === 'member' && (
          <div className="space-y-1.5 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Выберите участника для генерации персонального QR:</span>
              <span className="text-zinc-400 text-[11px]">
                {participants.length} человек в базе
              </span>
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-xs sm:text-sm text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-500 font-medium"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role}) — {p.id}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-400 leading-normal pt-1">
              Участник отсканирует этот код с экрана или перейдет по ссылке и сразу попадет в свой личный кабинет, где сможет отметить пожелания по напарникам, указать свои навыки и оборудование.
            </p>
          </div>
        )}

        {/* QR Code and Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-zinc-950/80 p-4 rounded-xl border border-zinc-800">
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-lg border border-zinc-300">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR-код для подключения"
                className="w-44 h-44 object-contain"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-zinc-900 font-medium text-xs">
                Генерация QR-кода...
              </div>
            )}
            <div className="mt-2 text-[10px] text-zinc-700 font-medium flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-zinc-900" />
              <span>Наведите камеру смартфона</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="font-bold text-white flex items-center gap-1.5">
              {qrMode === 'member' ? (
                <>
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Вход для: {selectedParticipant?.name}</span>
                </>
              ) : (
                <>
                  <Laptop className="w-4 h-4 text-blue-400" />
                  <span>Панель куратора</span>
                </>
              )}
            </div>

            <p className="text-zinc-400 text-[11px] leading-relaxed">
              {qrMode === 'member' ? (
                <>
                  Отсканировав QR-код, участник сразу открывает свой кабинет на телефоне и может:
                  <br />• Выбирать напарников, с кем хочет работать в группе
                  <br />• Редактировать свой VK ID и контакты
                  <br />• Просматривать вызывные и задачи съемок
                </>
              ) : (
                <>
                  Откройте ссылку на телефоне для куратора, чтобы распределять группы прямо на съёмочной площадке.
                </>
              )}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-lg transition-colors text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ссылка скопирована!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Скопировать прямую ссылку</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* URL Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300">Прямая ссылка для отправки в VK / Telegram:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={computedUrl}
              className="flex-1 bg-zinc-950 border border-zinc-800 text-xs px-3 py-2 rounded-lg text-zinc-300 font-mono select-all focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
          <span className="text-[11px] text-zinc-500">
            Генерируется автономно без внешних сервисов
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
