import React, { useState, useRef, useEffect } from 'react';
import {
  Clapperboard,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  CloudUpload,
  LogOut,
  Sparkles,
  Smartphone,
  Shield,
  History,
  Lock,
  BookOpen,
  ChevronDown,
  Wrench,
  Menu,
  X,
  LogIn,
  KeyRound,
  Calendar,
} from 'lucide-react';
import { ConflictItem, Participant, UserRole } from '../types';
import { User } from 'firebase/auth';

interface HeaderProps {
  currentView: 'moderator' | 'member' | 'guidelines';
  onViewChange: (view: 'moderator' | 'member' | 'guidelines') => void;
  selectedMember: Participant | null;
  onSelectMember: (member: Participant) => void;
  participants: Participant[];
  conflicts: ConflictItem[];
  userRole: UserRole;
  onOpenRoleSwitcher: () => void;
  onOpenAuditLog: () => void;
  onOpenConflicts: () => void;
  onExportExcel: () => void;
  onOpenWorkspaceModal: () => void;
  onOpenDeviceSync: () => void;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isLoggingIn: boolean;
  onAutoBalance: () => void;
  onOpenParticipantPins?: () => void;
  onOpenSecurityCenter?: () => void;
  onOpenKPP?: () => void;
  groupsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  selectedMember,
  conflicts,
  userRole,
  onOpenRoleSwitcher,
  onOpenAuditLog,
  onOpenConflicts,
  onExportExcel,
  onOpenWorkspaceModal,
  onOpenDeviceSync,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isLoggingIn,
  onAutoBalance,
  onOpenParticipantPins,
  onOpenSecurityCenter,
  onOpenKPP,
  groupsCount,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const headerContainerRef = useRef<HTMLElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
      if (headerContainerRef.current && !headerContainerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avoidCount = conflicts.filter((c) => c.type === 'avoided_partner_conflict').length;
  const roleCount = conflicts.filter((c) => c.type !== 'avoided_partner_conflict').length;

  const handleMobileNav = (view: 'moderator' | 'member' | 'guidelines') => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      ref={headerContainerRef}
      className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/90 text-white w-full"
    >
      <div className="max-w-[1800px] 2xl:max-w-[2100px] w-full mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4 min-w-0">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
              <Clapperboard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-bold text-sm sm:text-base tracking-wide text-zinc-100 font-mono truncate">
                КИНОЛАБОРАТОРИЯ
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 rounded font-mono shrink-0">
                {groupsCount !== undefined ? `${groupsCount} групп` : 'кино'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation View Switcher (md: and up) */}
          <nav className="hidden md:flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl shrink-0 text-xs sm:text-sm">
            {userRole === 'admin' ? (
              <>
                <button
                  onClick={() => onViewChange('moderator')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    currentView === 'moderator'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Панель куратора: съёмочные группы, задачи и медиатека"
                >
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>Куратор</span>
                </button>

                <button
                  onClick={() => onViewChange('member')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    currentView === 'member'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Кабинет участника (кураторский просмотр)"
                >
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span>Личный кабинет</span>
                  {selectedMember && (
                    <span className="hidden xl:inline-block px-1.5 py-0.5 bg-zinc-950 text-[10px] rounded text-zinc-400 font-mono">
                      {selectedMember.id}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onViewChange('member')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    currentView === 'member'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Мой личный кабинет участника (защищен PIN-кодом)"
                >
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span>Мой кабинет</span>
                </button>

                <button
                  onClick={() => onViewChange('moderator')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    currentView === 'moderator'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Просмотр всех групп кинолаборатории (только чтение)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                  <span>Все группы</span>
                </button>
              </>
            )}

            <button
              onClick={() => onViewChange('guidelines')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors ${
                currentView === 'guidelines'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Производственные памятки и чек-листы 12 цехов"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Памятка ролей</span>
            </button>
          </nav>

          {/* Desktop Actions Bar (md: and up) */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Role Badge & Switcher Button */}
            <button
              onClick={onOpenRoleSwitcher}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                userRole === 'admin'
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-300 hover:bg-amber-900/50'
                  : 'bg-blue-950/40 border-blue-800/80 text-blue-300 hover:bg-blue-900/50'
              }`}
              title="Нажмите для переключения роли (Администратор / Участник с PIN-кодом)"
            >
              {userRole === 'admin' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Администратор</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="truncate max-w-[120px]">
                    {selectedMember?.name || 'Участник'}
                  </span>
                </>
              )}
            </button>

            {/* Audit Log / Event Log Button (Admin Only) */}
            {userRole === 'admin' && (
              <button
                onClick={onOpenAuditLog}
                title="Журнал аудита действий (лог изменений составов, ролей и задач)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Лог</span>
              </button>
            )}

            {/* Security Center & Backups Button (Admin Only) */}
            {userRole === 'admin' && onOpenSecurityCenter && (
              <button
                onClick={onOpenSecurityCenter}
                title="Центр безопасности: диагностика систем, точки восстановления, защита от сброса и корзина участников"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Безопасность</span>
              </button>
            )}

            {/* Conflict / Stop-List Counter (Admin Only) */}
            {userRole === 'admin' && (
              <button
                onClick={onOpenConflicts}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  avoidCount > 0
                    ? 'bg-rose-950/80 border-rose-700 text-rose-200 hover:bg-rose-900 shadow-sm animate-pulse'
                    : roleCount > 0
                    ? 'bg-zinc-900 border-zinc-750 text-zinc-300 hover:bg-zinc-850'
                    : 'bg-zinc-900/60 border-zinc-800 text-emerald-400 hover:text-emerald-300'
                }`}
                title={`Стоп-листы: ${avoidCount} несовместимостей. Ролевые предупреждения: ${roleCount}. Нажмите для деталей.`}
              >
                <AlertCircle
                  className={`w-3.5 h-3.5 ${
                    avoidCount > 0
                      ? 'text-rose-400'
                      : roleCount > 0
                      ? 'text-amber-400/80'
                      : 'text-emerald-400'
                  }`}
                />
                {avoidCount > 0 ? (
                  <span className="font-bold text-rose-300">
                    ⛔ {avoidCount}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-mono">
                    ✓ 0
                  </span>
                )}
              </button>
            )}

            {/* Tools Dropdown Menu (Admin Only) */}
            {userRole === 'admin' && (
              <div className="relative" ref={toolsMenuRef}>
                <button
                  onClick={() => setIsToolsOpen((prev) => !prev)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    isToolsOpen
                      ? 'bg-zinc-800 border-zinc-700 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                  title="Инструменты экспорта, облачной синхронизации и авто-балансировки"
                >
                  <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Инструменты</span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>

                {isToolsOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-fade-in">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                      Экспорт и интеграции
                    </div>

                    <button
                      onClick={() => {
                        onExportExcel();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Скачать Excel (.xlsx)</div>
                        <div className="text-[10px] text-zinc-500">Сводная таблица групп и ролей</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onOpenWorkspaceModal();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                    >
                      <CloudUpload className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Google Workspace</div>
                        <div className="text-[10px] text-zinc-500">Синхронизация Sheets / Docs / Tasks</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onOpenDeviceSync();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Телефон + ПК (QR)</div>
                        <div className="text-[10px] text-zinc-500">Открыть на мобильном и синхронизировать</div>
                      </div>
                    </button>

                    <div className="px-2.5 pt-1.5 pb-0.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-t border-zinc-800 mt-1">
                      Администрирование
                    </div>
                    <button
                      onClick={() => {
                        onAutoBalance();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 transition-colors text-left"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Авто-балансировка</div>
                        <div className="text-[10px] text-amber-400/80">Оптимизировать составы по ролям</div>
                      </div>
                    </button>

                    {onOpenKPP && (
                      <button
                        onClick={() => {
                          onOpenKPP();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 transition-colors text-left"
                      >
                        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Производственный КПП</div>
                          <div className="text-[10px] text-amber-400/80">График и сдача 5 пилотов</div>
                        </div>
                      </button>
                    )}

                    {onOpenParticipantPins && (
                      <button
                        onClick={() => {
                          onOpenParticipantPins();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 transition-colors text-left"
                      >
                        <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Коды доступа (PIN)</div>
                          <div className="text-[10px] text-emerald-400/80">Реестр и восстановление PIN</div>
                        </div>
                      </button>
                    )}

                    {onOpenSecurityCenter && (
                      <button
                        onClick={() => {
                          onOpenSecurityCenter();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 transition-colors text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Центр безопасности</div>
                          <div className="text-[10px] text-emerald-400/80">Диагностика, снимки и Корзина</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Google User Avatar / Login */}
            {googleUser ? (
              <div className="flex items-center gap-1 pl-1">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google'}
                    className="w-7 h-7 rounded-full border border-zinc-700"
                    title={`Вход выполнен: ${googleUser.email || googleUser.displayName}`}
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-bold border border-zinc-700"
                    title={`Вход выполнен: ${googleUser.email || googleUser.displayName}`}
                  >
                    {googleUser.displayName?.[0] || 'G'}
                  </div>
                )}
                <button
                  onClick={onGoogleSignOut}
                  title="Выйти из аккаунта Google"
                  className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
                title="Войти через Google Workspace (аккаунт администратора: p0p0vkyandex@gmail.com)"
              >
                <span>Войти</span>
              </button>
            )}
          </div>

          {/* Mobile Right Controls (< md) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {/* Conflict Counter Button (Admin Only) */}
            {userRole === 'admin' && (
              <button
                onClick={onOpenConflicts}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold ${
                  avoidCount > 0
                    ? 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse'
                    : 'bg-zinc-900 border-zinc-800 text-emerald-400'
                }`}
                title="Проверка стоп-листов и конфликтов"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{avoidCount > 0 ? avoidCount : '0'}</span>
              </button>
            )}

            {/* Role Switcher Button */}
            <button
              onClick={onOpenRoleSwitcher}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold ${
                userRole === 'admin'
                  ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                  : 'bg-blue-950/70 border-blue-800 text-blue-300'
              }`}
              title="Сменить роль (Администратор / Участник)"
            >
              {userRole === 'admin' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Админ</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Профиль</span>
                </>
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              aria-label="Меню приложения"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-amber-400" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Segmented Row (< md) */}
        <div className="md:hidden pb-2 pt-0.5">
          <div className="grid grid-cols-3 gap-1 bg-zinc-900/95 border border-zinc-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => handleMobileNav('moderator')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors text-center ${
                currentView === 'moderator'
                  ? 'bg-zinc-800 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{userRole === 'admin' ? 'Куратор' : 'Группы'}</span>
            </button>

            <button
              onClick={() => handleMobileNav('member')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors text-center ${
                currentView === 'member'
                  ? 'bg-zinc-800 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Кабинет</span>
            </button>

            <button
              onClick={() => handleMobileNav('guidelines')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors text-center ${
                currentView === 'guidelines'
                  ? 'bg-zinc-800 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Памятка</span>
            </button>
          </div>
        </div>

        {/* Mobile Drawer / Expandable Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-3 space-y-2 bg-zinc-950/98 animate-fade-in">
            {/* Google User Status */}
            <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
              {googleUser ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google'}
                      className="w-7 h-7 rounded-full border border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-bold shrink-0">
                      {googleUser.displayName?.[0] || 'G'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {googleUser.displayName || 'Google пользователь'}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate">
                      {googleUser.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-400">
                  Вход в Google Workspace не выполнен
                </div>
              )}

              {googleUser ? (
                <button
                  onClick={() => {
                    onGoogleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg font-medium shrink-0 flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Выйти</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onGoogleSignIn();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isLoggingIn}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-950 text-xs rounded-lg font-bold shrink-0 flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Войти</span>
                </button>
              )}
            </div>

            {/* Quick Actions List in Drawer */}
            <div className="space-y-1 pt-1">
              {/* Role Switcher */}
              <button
                onClick={() => {
                  onOpenRoleSwitcher();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Переключить роль (Администратор / Участник)</span>
                </div>
                <span className="font-mono text-zinc-500">→</span>
              </button>

              {/* Audit Log (Admin Only) */}
              {userRole === 'admin' && (
                <>
                  {onOpenParticipantPins && (
                    <button
                      onClick={() => {
                        onOpenParticipantPins();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800 text-xs text-emerald-200"
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">Коды доступа и PIN участников</span>
                      </div>
                      <span className="font-mono text-emerald-400">→</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onOpenAuditLog();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Журнал аудита действий (Лог)</span>
                    </div>
                    <span className="font-mono text-zinc-500">→</span>
                  </button>

                  {onOpenKPP && (
                    <button
                      onClick={() => {
                        onOpenKPP();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-amber-300"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span>Производственный КПП (5 групп)</span>
                      </div>
                      <span className="font-mono text-amber-400">→</span>
                    </button>
                  )}

                  {onOpenSecurityCenter && (
                    <button
                      onClick={() => {
                        onOpenSecurityCenter();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-emerald-300"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Центр безопасности и бэкапов</span>
                      </div>
                      <span className="font-mono text-emerald-400">→</span>
                    </button>
                  )}

                  {/* Excel Export */}
              <button
                onClick={() => {
                  onExportExcel();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Скачать Excel отчет (.xlsx)</span>
                </div>
                <span className="font-mono text-zinc-500">→</span>
              </button>

              {/* Google Workspace */}
              <button
                onClick={() => {
                  onOpenWorkspaceModal();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <CloudUpload className="w-4 h-4 text-blue-400" />
                  <span>Google Workspace (Sheets / Docs / Tasks)</span>
                </div>
                <span className="font-mono text-zinc-500">→</span>
              </button>

              {/* Device Sync QR */}
              <button
                onClick={() => {
                  onOpenDeviceSync();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>QR-код синхронизации (Смартфон + ПК)</span>
                </div>
                <span className="font-mono text-zinc-500">→</span>
              </button>

                  {/* Auto balance for Admin */}
                  <button
                    onClick={() => {
                      onAutoBalance();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/80 text-xs text-amber-200"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Авто-балансировка съёмочных групп</span>
                    </div>
                    <span className="font-mono text-amber-400">→</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
