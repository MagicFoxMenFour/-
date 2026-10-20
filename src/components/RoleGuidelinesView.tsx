import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  Search,
  Clapperboard,
  Video,
  PenTool,
  Volume2,
  Briefcase,
  Palette,
  Users,
  Scissors,
  UserCheck,
  Sun,
  Sparkles,
  Camera,
  Layers,
  Clock,
  CheckSquare,
  AlertTriangle,
  Lightbulb,
  XCircle,
  Music,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { ROLES } from '../data/roles';
import { RoleBookRecommendation, RoleInfo, RoleType, UserRole } from '../types';
import {
  getBooksForRole,
  addBookToRole,
  updateBookInRole,
  deleteBookFromRole,
  resetBooksForRole,
  clearBooksForRole,
  subscribeToRoleBooks,
} from '../services/booksService';
import { triggerBookDownload } from '../services/bookStorage';
import { EditBookModal } from './EditBookModal';

interface RoleGuidelinesViewProps {
  initialRoleType?: RoleType;
  onBack?: () => void;
  userRole?: UserRole;
}

export const RoleGuidelinesView: React.FC<RoleGuidelinesViewProps> = ({
  initialRoleType = 'director',
  onBack,
  userRole = 'admin',
}) => {
  const [selectedRoleType, setSelectedRoleType] = useState<RoleType>(initialRoleType);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'student_focus' | 'checklist' | 'stages' | 'books'>('student_focus');
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Bookshelf state and editing
  const [roleBooks, setRoleBooks] = useState<RoleBookRecommendation[]>(() =>
    getBooksForRole(selectedRoleType)
  );
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<RoleBookRecommendation | null>(null);
  const [editingBookIndex, setEditingBookIndex] = useState<number | null>(null);

  useEffect(() => {
    setRoleBooks(getBooksForRole(selectedRoleType));
    const unsubscribe = subscribeToRoleBooks(() => {
      setRoleBooks(getBooksForRole(selectedRoleType));
    });
    return unsubscribe;
  }, [selectedRoleType]);

  useEffect(() => {
    if (initialRoleType) {
      setSelectedRoleType(initialRoleType);
    }
  }, [initialRoleType]);

  const activeRole: RoleInfo = ROLES[selectedRoleType] || ROLES.director;

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return Object.values(ROLES);

    return Object.values(ROLES).filter((r) => {
      return (
        r.title.toLowerCase().includes(q) ||
        r.shortTitle.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.responsibilities.some((resp) => resp.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  const handleCopyMemo = () => {
    const textLines = [
      `🎬 РЕГЛАМЕНТ И ПАМЯТКА ЦЕХА: ${activeRole.title.toUpperCase()}`,
      `Кинолаборатория студенческого сериала\n`,
      `📌 СУТЬ И МИССИЯ РОЛИ:`,
      `${activeRole.description}\n`,
      `🚨 КРИТИЧЕСКИ ВАЖНО В СТУДЕНЧЕСКОМ КИНО:`,
      ...(activeRole.studentFocus?.critical || []).map((c, i) => `${i + 1}. ${c}`),
      `\n💡 СТУДЕНЧЕСКИЕ ЛАЙФХАКИ ДЛЯ ПЛОЩАДКИ:`,
      ...(activeRole.studentFocus?.studentTips || []).map((t, i) => `• ${t}`),
      `\n⚠️ ЧТО ЧАСТО ПЕРЕОЦЕНИВАЮТ (НЕ ТРАТЬТЕ СИЛЫ):`,
      ...(activeRole.studentFocus?.unimportant || []).map((u, i) => `— ${u}`),
      `\n📋 ЧЕК-ЛИСТ СЪЁМОЧНОЙ СМЕНЫ:`,
      ...(activeRole.shiftChecklist || []).map((ch, i) => `[ ] ${ch}`),
      `\n📦 ЧТО СДАТЬ (РЕЗУЛЬТАТЫ):`,
      ...(activeRole.deliverables || []).map((d) => `• ${d.name} (${d.format}) — ${d.deadlineDescription}`),
    ];

    navigator.clipboard.writeText(textLines.join('\n')).then(() => {
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 2500);
    });
  };

  const handleDownloadTxt = () => {
    const textLines = [
      `🎬 РЕГЛАМЕНТ И ПАМЯТКА ЦЕХА: ${activeRole.title.toUpperCase()}`,
      `Кинолаборатория студенческого сериала\n`,
      `ОПИСАНИЕ РОЛИ:`,
      `${activeRole.description}\n`,
      `ОСНОВНЫЕ ОБЯЗАННОСТИ:`,
      ...activeRole.responsibilities.map((r, i) => `${i + 1}. ${r}`),
      `\nКРИТИЧЕСКИ ВАЖНО:`,
      ...(activeRole.studentFocus?.critical || []).map((c, i) => `* ${c}`),
      `\nЛАЙФХАКИ ДЛЯ СТУДЕНТОВ:`,
      ...(activeRole.studentFocus?.studentTips || []).map((t) => `* ${t}`),
      `\nЧЕК-ЛИСТ СМЕНЫ:`,
      ...(activeRole.shiftChecklist || []).map((ch) => `[ ] ${ch}`),
    ];

    const blob = new Blob([textLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pamjatka_${activeRole.type}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRoleIcon = (type: RoleType) => {
    switch (type) {
      case 'director':
        return Clapperboard;
      case 'dop':
        return Video;
      case 'screenwriter':
        return PenTool;
      case 'sound_designer':
        return Volume2;
      case 'producer':
        return Briefcase;
      case 'production_designer':
        return Palette;
      case 'actor':
        return Users;
      case 'editor':
        return Scissors;
      case 'assistant':
        return UserCheck;
      case 'makeup_artist':
        return Sparkles;
      case 'camera_2':
        return Camera;
      case 'composer':
        return Music;
      default:
        return Clapperboard;
    }
  };

  const ActiveIcon = getRoleIcon(activeRole.type);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl shrink-0 mt-0.5">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white">
                Производственные памятки и регламенты 12 цехов
              </h2>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white rounded-lg text-xs font-medium border border-zinc-700 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    {userRole === 'admin' ? 'В панель куратора' : 'В мой кабинет'}
                  </span>
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Официальный производственный свод правил кинолаборатории (12 цехов): студенческий фокус, типичные ошибки, чек-листы смен, обязанности по этапам и книжная полка.
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Поиск по 12 цехам и навыкам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-750 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Role Selector Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Выберите цех для изучения памятки ({filteredRoles.length} из 12)
          </h3>
          <span className="text-[11px] text-zinc-500">
            Нажмите на карточку роли для открытия полного регламента
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-12 gap-2.5">
          {filteredRoles.map((role) => {
            const Icon = getRoleIcon(role.type);
            const isSelected = role.type === selectedRoleType;

            return (
              <button
                key={role.type}
                onClick={() => setSelectedRoleType(role.type)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-md shadow-amber-950/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {role.essential ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-500 font-mono">
                      1 чел.
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-950/60 text-pink-300 font-mono">
                      Опц.
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold truncate leading-tight">
                    {role.shortTitle}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {role.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Role Guideline Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Role Header Banner */}
        <div className="p-6 bg-zinc-950/80 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ActiveIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-white">
                  {activeRole.title}
                </h3>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                  {activeRole.shortTitle}
                </span>
                {activeRole.essential ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    Обязательная роль команды
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800">
                    Опциональная роль
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed max-w-3xl">
                {activeRole.description}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyMemo}
              title="Скопировать памятку в буфер для отправки в VK/Telegram чат группы"
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-md shadow-amber-600/20"
            >
              {copiedStatus ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Скопировано в буфер!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать для VK</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadTxt}
              title="Скачать памятку роли отдельным текстовым файлом"
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Скачать (.txt)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-3 sm:px-6 pt-3 gap-2 overflow-x-auto text-xs font-semibold no-scrollbar">
          <button
            onClick={() => setActiveTab('student_focus')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'student_focus'
                ? 'border-amber-400 text-amber-300 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Специфика студенческого кино</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-amber-400 text-amber-300 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Чек-лист смены и обязанности</span>
          </button>

          <button
            onClick={() => setActiveTab('stages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'stages'
                ? 'border-amber-400 text-amber-300 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Фазы производства (График)</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'books'
                ? 'border-amber-400 text-amber-300 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Библиотека и литература</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* TAB 1: Специфика студенческого кино */}
          {activeTab === 'student_focus' && (
            <div className="space-y-6">
              {/* Critical advice */}
              <div className="bg-red-950/20 border border-red-900/60 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>КРИТИЧЕСКИ ВАЖНО В СТУДЕНЧЕСКОМ КИНО (Золотые правила цеха)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(activeRole.studentFocus?.critical || []).map((tip, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950/80 p-3.5 rounded-xl border border-red-900/30 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Tips & Lifehacks */}
              <div className="bg-amber-950/20 border border-amber-900/60 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>СТУДЕНЧЕСКИЕ ЛАЙФХАКИ И ХИТРОСТИ ДЛЯ ПЛОЩАДКИ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(activeRole.studentFocus?.studentTips || []).map((tip, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950/80 p-3.5 rounded-xl border border-amber-900/30 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5"
                    >
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unimportant / Overrated */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
                  <XCircle className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>ЧТО ЧАСТО ПЕРЕОЦЕНИВАЮТ (Не тратьте на это драгоценные силы и время)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(activeRole.studentFocus?.unimportant || []).map((tip, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-850 text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="text-zinc-600 font-bold">—</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Чек-лист и обязанности */}
          {activeTab === 'checklist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shift Checklist */}
              <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckSquare className="w-4 h-4" />
                  <span>Чек-лист съёмочной смены</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Пошаговый контроль перед съёмками, на площадке и после команды «Снято!»:
                </p>
                <div className="space-y-2 pt-1">
                  {(activeRole.shiftChecklist || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-850 text-xs text-zinc-300 flex items-start gap-2.5"
                    >
                      <div className="w-4 h-4 rounded border border-zinc-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Responsibilities & Deliverables */}
              <div className="space-y-4">
                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <Check className="w-4 h-4" />
                    <span>Базовые обязанности в группе</span>
                  </div>
                  <div className="space-y-2">
                    {activeRole.responsibilities.map((resp, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-850 text-xs text-zinc-300 flex items-start gap-2"
                      >
                        <span className="text-blue-400 font-bold">{idx + 1}.</span>
                        <span>{resp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverables */}
                {activeRole.deliverables && activeRole.deliverables.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Ожидаемые результаты (Что сдать куратору)</span>
                    </div>
                    <div className="space-y-2">
                      {activeRole.deliverables.map((del, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-850 text-xs text-zinc-300 flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="font-semibold text-white">{del.name}</div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">{del.format}</div>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono shrink-0">
                            {del.deadlineDescription}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Фазы производства */}
          {activeTab === 'stages' && (
            <div className="space-y-4">
              {(activeRole.stageBreakdown || []).map((stage, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-mono">
                        0{idx + 1}
                      </span>
                      <span>{stage.stageTitle}</span>
                    </span>
                    <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {stage.stage}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    {stage.duties.map((duty, dIdx) => (
                      <div
                        key={dIdx}
                        className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-850 text-xs text-zinc-300 flex items-start gap-2"
                      >
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{duty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Литература и взаимодействие */}
          {activeTab === 'books' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Books */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Рекомендуемая литература ({roleBooks.length})</span>
                  </div>

                  {userRole === 'admin' && (
                    <div className="flex items-center gap-2">
                      {roleBooks && roleBooks.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm(`Очистить все книги цеха «${activeRole.title}»?`)) {
                              clearBooksForRole(selectedRoleType);
                            }
                          }}
                          title="Очистить список книг этого цеха"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-850 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-300 border border-zinc-750 hover:border-rose-700/60 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Очистить</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingBook(null);
                          setEditingBookIndex(null);
                          setIsEditBookModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить книгу</span>
                      </button>
                    </div>
                  )}
                </div>

                {roleBooks && roleBooks.length > 0 ? (
                  roleBooks.map((book, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 hover:border-zinc-700 transition-colors relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-white">
                            «{book.title}»
                          </div>
                          <div className="text-xs text-purple-300 font-medium mt-0.5">
                            Автор: {book.author}
                          </div>
                        </div>

                        {userRole === 'admin' && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingBook(book);
                                setEditingBookIndex(idx);
                                setIsEditBookModalOpen(true);
                              }}
                              title="Редактировать книгу или загрузить PDF"
                              className="p-1.5 text-zinc-400 hover:text-indigo-300 rounded hover:bg-zinc-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Удалить книгу «${book.title}»?`)) {
                                  deleteBookFromRole(selectedRoleType, idx);
                                }
                              }}
                              title="Удалить книгу"
                              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {book.whyRead}
                      </p>

                      {/* PDF / Document Download Button */}
                      <div className="pt-2 border-t border-zinc-850/80">
                        {book.fileName || book.fileData || book.fileUrl ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => triggerBookDownload(book)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="truncate">
                                Скачать книгу {book.fileName ? `(${book.fileName})` : '(.pdf)'}
                              </span>
                              {book.fileSize && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-700 text-indigo-200 text-[10px] font-mono font-normal shrink-0">
                                  {book.fileSize}
                                </span>
                              )}
                            </button>

                            {book.fileUrl && (book.fileName || book.fileData) && (
                              <a
                                href={book.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Открыть внешнюю ссылку на облако"
                                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-zinc-500">
                            <span>Электронный файл пока не загружен</span>
                            {userRole === 'admin' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBook(book);
                                  setEditingBookIndex(idx);
                                  setIsEditBookModalOpen(true);
                                }}
                                className="text-indigo-400 hover:text-indigo-300 font-medium underline"
                              >
                                + Загрузить PDF
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                    Список профильной литературы пока пуст.
                  </div>
                )}
              </div>

              {/* Collaborates with */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Users className="w-4 h-4" />
                  <span>С кем взаимодействует на съёмках</span>
                </div>
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Для слаженной работы на площадке этот специалист должен непрерывно координироваться со следующими цехами:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(activeRole.collaboratesWith || []).map((collab, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-medium"
                      >
                        {collab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Add Book Modal */}
      {isEditBookModalOpen && (
        <EditBookModal
          isOpen={isEditBookModalOpen}
          onClose={() => {
            setIsEditBookModalOpen(false);
            setEditingBook(null);
            setEditingBookIndex(null);
          }}
          roleType={selectedRoleType}
          book={editingBook}
          bookIndex={editingBookIndex}
          onSave={(bookData, idx) => {
            if (idx !== null && idx !== undefined) {
              updateBookInRole(selectedRoleType, idx, bookData);
            } else {
              addBookToRole(selectedRoleType, bookData);
            }
          }}
          onDelete={(idx) => {
            deleteBookFromRole(selectedRoleType, idx);
          }}
        />
      )}
    </div>
  );
};
