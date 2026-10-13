import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  User as UserIcon,
  Check,
  Search,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { Participant, UserRole } from '../types';
import { ROLES } from '../data/roles';
import { User } from 'firebase/auth';
import {
  isCuratorUnlocked,
  verifyCuratorPasscode,
  verifyParticipantPin,
  ADMIN_EMAILS,
} from '../services/accessControl';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  selectedParticipant: Participant | null;
  participants: Participant[];
  googleUser?: User | null;
  onGoogleSignIn?: () => void;
  onSelectRole: (role: UserRole, participant?: Participant) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  selectedParticipant,
  participants,
  googleUser,
  onGoogleSignIn,
  onSelectRole,
}) => {
  const [selectedRoleType, setSelectedRoleType] = useState<UserRole>(currentRole);
  const [chosenParticipantId, setChosenParticipantId] = useState<string>(
    selectedParticipant?.id || participants[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Passcode states
  const [curatorPasscode, setCuratorPasscode] = useState('');
  const [participantPin, setParticipantPin] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isUserCuratorVerified = isCuratorUnlocked(googleUser?.email);

  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ROLES[p.role]?.title || p.role).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chosenParticipant =
    participants.find((p) => p.id === chosenParticipantId) || participants[0];

  const handleApply = () => {
    setErrorMessage(null);

    if (selectedRoleType === 'admin') {
      // Check if already curator verified via Google or entered PIN
      if (isUserCuratorVerified) {
        onSelectRole('admin');
        onClose();
        return;
      }

      // Verify entered passcode
      if (verifyCuratorPasscode(curatorPasscode)) {
        onSelectRole('admin');
        onClose();
      } else {
        setErrorMessage(
          'Неверный код доступа куратора. Доступ к панели администратора разрешён только уполномоченным лицам кинолаборатории.'
        );
      }
    } else {
      // Switching to participant: verify participant's PIN
      // (If current user is already verified curator, curator has supervisor override)
      if (isUserCuratorVerified) {
        onSelectRole('participant', chosenParticipant);
        onClose();
        return;
      }

      if (!participantPin.trim()) {
        setErrorMessage('Введите персональный PIN-код для входа в кабинет участника.');
        return;
      }

      const isValid = verifyParticipantPin(chosenParticipant.id, participantPin);
      if (isValid) {
        onSelectRole('participant', chosenParticipant);
        onClose();
      } else {
        setErrorMessage(
          `Неверный личный PIN-код участника ${chosenParticipant.name} (${chosenParticipant.id}). Посторонний доступ заблокирован.`
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Авторизация и контроль доступа</h2>
              <p className="text-xs text-zinc-400">
                Разделение прав: Панель куратора и защищённый личный кабинет участника
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Role Cards Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Admin Card */}
            <div
              onClick={() => {
                setSelectedRoleType('admin');
                setErrorMessage(null);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedRoleType === 'admin'
                  ? 'bg-zinc-800/90 border-amber-500/80 ring-2 ring-amber-500/30'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                {selectedRoleType === 'admin' && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-xs font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-3 flex items-center gap-1.5">
                <span>Администратор</span>
                {isUserCuratorVerified && (
                  <span title="Доступ подтвержден">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </span>
                )}
              </h3>
              <p className="text-xs text-amber-300 font-medium mt-0.5">Куратор / Мастер лаборатории</p>
              <ul className="text-[11px] text-zinc-400 mt-2.5 space-y-1 list-disc list-inside">
                <li>Полный контроль всех съёмочных групп</li>
                <li>Перемещение участников и балансировка</li>
                <li>Управление книжной полкой и памятками</li>
                <li>Журнал аудита действий (лог)</li>
              </ul>
            </div>

            {/* Participant Card */}
            <div
              onClick={() => {
                setSelectedRoleType('participant');
                setErrorMessage(null);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedRoleType === 'participant'
                  ? 'bg-zinc-800/90 border-blue-500/80 ring-2 ring-blue-500/30'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                {selectedRoleType === 'participant' && (
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-zinc-950 flex items-center justify-center text-xs font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-3">Участник</h3>
              <p className="text-xs text-blue-300 font-medium mt-0.5">Личный защищённый кабинет</p>
              <ul className="text-[11px] text-zinc-400 mt-2.5 space-y-1 list-disc list-inside">
                <li>Доступ исключительно к своему кабинету</li>
                <li>Защита стоп-листов и контактов PIN-кодом</li>
                <li>Сдача материалов и отметка задач</li>
                <li>Просмотр структуры групп (только чтение)</li>
              </ul>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Admin Passcode Gate (if Admin selected) */}
          {selectedRoleType === 'admin' && (
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Код доступа куратора:</span>
                </label>
                {isUserCuratorVerified && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Авторизован
                  </span>
                )}
              </div>

              {isUserCuratorVerified ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Вы авторизованы как администратор{googleUser ? ` (${googleUser.email})` : ''}. Полный доступ открыт.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      placeholder="Введите секретный пароль администратора..."
                      value={curatorPasscode}
                      onChange={(e) => setCuratorPasscode(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">
                      Куратор также может войти через учётную запись Google:
                    </span>
                    {onGoogleSignIn && (
                      <button
                        type="button"
                        onClick={onGoogleSignIn}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <LogIn className="w-3 h-3 text-amber-400" />
                        <span>Google Sign-in</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Participant Picker & PIN Gate (if Participant selected) */}
          {selectedRoleType === 'participant' && (
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Выберите свой профиль участника:</span>
                </label>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {filteredParticipants.length} из {participants.length}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Поиск по имени, роли или CINE-нормативу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Participant List */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-zinc-850">
                {filteredParticipants.map((p) => {
                  const roleDef = ROLES[p.role];
                  const isSelected = p.id === chosenParticipantId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setChosenParticipantId(p.id);
                        setErrorMessage(null);
                      }}
                      className={`pt-1.5 pb-1 px-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-950/60 border border-blue-700/80 text-white'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono text-zinc-400 font-semibold">
                          {p.id}
                        </span>
                        <div>
                          <div className="text-xs font-semibold">{p.name}</div>
                          <div className="text-[11px] text-zinc-400">
                            {roleDef?.title || p.role} • {p.groupId ? `Группа ${p.groupId.replace('grp-', '')}` : 'Резерв'}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Выбран
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Participant Personal PIN Input */}
              {!isUserCuratorVerified && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <label className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    <span>Личный PIN-код участника {chosenParticipant.name}:</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      placeholder="Введите 4-значный PIN-код доступа..."
                      maxLength={8}
                      value={participantPin}
                      onChange={(e) => setParticipantPin(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Персональный кабинет защищён: посторонние не смогут получить доступ к вашим стоп-листам и настройкам.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleApply}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md ${
              selectedRoleType === 'admin'
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            Подтвердить и войти
          </button>
        </div>
      </div>
    </div>
  );
};
