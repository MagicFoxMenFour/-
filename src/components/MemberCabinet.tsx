import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  ExternalLink,
  Clock,
  Link as LinkIcon,
  Film,
  BookOpen,
  Edit3,
  Check,
  Edit2,
  Copy,
  CheckCircle2,
  ListOrdered,
  Package,
  Layers,
  Sparkles,
  Users2,
  ChevronDown,
  Calendar,
  Camera,
  Scissors,
  Heart,
  Ban,
  ShieldAlert,
  ShieldCheck,
  Target,
  Info,
  Lightbulb,
  BookMarked,
  GraduationCap,
  AlertTriangle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Plus,
  RotateCcw,
  Trash2,
  Download,
  Wrench,
} from 'lucide-react';
import {
  FilmGroup,
  Participant,
  RoleBookRecommendation,
  RoleType,
  UserRole,
} from '../types';
import { ROLES } from '../data/roles';
import {
  isParticipantCabinetUnlocked,
  verifyParticipantPin,
  setUnlockedParticipantId,
  setParticipantPin,
  generateRandomPin,
} from '../services/accessControl';
import {
  getBooksForRole,
  addBookToRole,
  updateBookInRole,
  deleteBookFromRole,
  resetBooksForRole,
  subscribeToRoleBooks,
} from '../services/booksService';
import { triggerBookDownload } from '../services/bookStorage';
import { EditBookModal } from './EditBookModal';

interface MemberCabinetProps {
  currentMember: Participant;
  allParticipants: Participant[];
  groups: FilmGroup[];
  userRole?: UserRole;
  onSelectMember: (member: Participant) => void;
  onEditParticipant: (participant: Participant) => void;
  onUpdateMemberVk: (participantId: string, vkId: string, vkUrl: string) => void;
  onUpdateMemberPreferences: (
    participantId: string,
    preferredWithIds: string[],
    avoidedWithIds: string[],
    desiredRoles?: RoleType[]
  ) => void;
  onRemoveAvoidLink?: (p1Id: string, p2Id: string) => void;
  onOpenRoleGuidelines?: (role: RoleType) => void;
  onUpdateParticipantPin?: (participantId: string, newPin: string) => void;
  onUpdateParticipantSkills?: (participantId: string, skills: string[]) => void;
}


export const MemberCabinet: React.FC<MemberCabinetProps> = ({
  currentMember,
  allParticipants,
  groups,
  userRole = 'participant',
  onSelectMember,
  onEditParticipant,
  onUpdateMemberVk,
  onUpdateMemberPreferences,
  onRemoveAvoidLink,
  onOpenRoleGuidelines,
  onUpdateParticipantPin,
  onUpdateParticipantSkills,
}) => {
  const [isEditingVk, setIsEditingVk] = useState(false);
  const [tempVkId, setTempVkId] = useState(currentMember.vkId);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>(
    currentMember.preferredWithIds || []
  );
  const [avoidedPartnerIds, setAvoidedPartnerIds] = useState<string[]>(
    currentMember.avoidedWithIds || []
  );
  const [desiredRoles, setDesiredRoles] = useState<RoleType[]>(
    currentMember.desiredRoles || []
  );
  const [isSavedDesiredRoles, setIsSavedDesiredRoles] = useState(false);
  const [preferenceTab, setPreferenceTab] = useState<'preferred' | 'avoided'>('preferred');
  const [partnerSearch, setPartnerSearch] = useState('');

  // Special skills state
  const [skillsList, setSkillsList] = useState<string[]>(currentMember.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isSavedSkillsFeedback, setIsSavedSkillsFeedback] = useState(false);

  useEffect(() => {
    setSkillsList(currentMember.skills || []);
  }, [currentMember.id, currentMember.skills]);

  const handleSaveSkills = (newSkills: string[]) => {
    const cleaned = Array.from(new Set(newSkills.map((s) => s.trim()).filter(Boolean)));
    setSkillsList(cleaned);
    if (onUpdateParticipantSkills) {
      onUpdateParticipantSkills(currentMember.id, cleaned);
    } else if (onEditParticipant) {
      onEditParticipant({
        ...currentMember,
        skills: cleaned,
      });
    }
    setIsSavedSkillsFeedback(true);
    setTimeout(() => setIsSavedSkillsFeedback(false), 2500);
  };

  const handleAddSingleSkill = (skillText?: string) => {
    const raw = (skillText !== undefined ? skillText : newSkillInput).trim();
    if (!raw) return;
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const updated = [...skillsList];
    items.forEach((item) => {
      if (!updated.includes(item)) {
        updated.push(item);
      }
    });
    handleSaveSkills(updated);
    if (skillText === undefined) {
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    handleSaveSkills(updated);
  };

  // Personal Cabinet PIN security states
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() =>
    isParticipantCabinetUnlocked(currentMember.id, userRole === 'admin')
  );
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [newPinValue, setNewPinValue] = useState('');
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [showCurrentPinInProfile, setShowCurrentPinInProfile] = useState(false);

  useEffect(() => {
    setIsUnlocked(isParticipantCabinetUnlocked(currentMember.id, userRole === 'admin'));
    setEnteredPin('');
    setPinError(null);
  }, [currentMember.id, userRole]);

  const handleUnlockCabinet = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = enteredPin.trim();
    if (!clean) {
      setPinError('Введите ваш персональный 4-значный PIN-код');
      return;
    }
    if (clean === '1234') {
      setPinError('Вход по коду 1234 закрыт. Каждому участнику присвоен уникальный 4-значный PIN-код. Узнайте его у куратора.');
      return;
    }
    if (verifyParticipantPin(currentMember.id, clean, currentMember.pinCode)) {
      setIsUnlocked(true);
      setPinError(null);
    } else {
      setPinError('Неверный PIN-код. Обратитесь к куратору вашей группы для получения доступа.');
    }
  };

  const handleLockCabinet = () => {
    setUnlockedParticipantId(null);
    setIsUnlocked(false);
    setEnteredPin('');
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPinValue.trim();
    if (clean.length !== 4 || !/^\d{4}$/.test(clean)) {
      setChangePinError('PIN-код должен состоять ровно из 4 цифр (например, 7482)');
      return;
    }
    if (clean === '1234') {
      setChangePinError('Код 1234 запрещен политикой безопасности');
      return;
    }
    setParticipantPin(currentMember.id, clean);
    if (onUpdateParticipantPin) {
      onUpdateParticipantPin(currentMember.id, clean);
    } else {
      onEditParticipant({
        ...currentMember,
        pinCode: clean,
      });
    }
    setPinChangeSuccess(true);
    setChangePinError(null);
    setTimeout(() => {
      setPinChangeSuccess(false);
      setIsChangePinOpen(false);
      setNewPinValue('');
    }, 1600);
  };

  // Role Guideline State
  const [viewedRoleType, setViewedRoleType] = useState<RoleType>(currentMember.role);
  const [guidelineTab, setGuidelineTab] = useState<'focus' | 'stages' | 'books' | 'deliverables' | 'checklist'>('focus');
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});
  const [copiedGuideline, setCopiedGuideline] = useState(false);

  // Bookshelf live data and editing
  const [cabinetRoleBooks, setCabinetRoleBooks] = useState<RoleBookRecommendation[]>(() =>
    getBooksForRole(viewedRoleType)
  );
  const [isCabinetBookModalOpen, setIsCabinetBookModalOpen] = useState(false);
  const [editingCabinetBook, setEditingCabinetBook] = useState<RoleBookRecommendation | null>(null);
  const [editingCabinetBookIndex, setEditingCabinetBookIndex] = useState<number | null>(null);

  useEffect(() => {
    setCabinetRoleBooks(getBooksForRole(viewedRoleType));
    const unsub = subscribeToRoleBooks(() => {
      setCabinetRoleBooks(getBooksForRole(viewedRoleType));
    });
    return unsub;
  }, [viewedRoleType]);

  // Sync viewed role with current member role when member changes
  useEffect(() => {
    setViewedRoleType(currentMember.role);
    setTempVkId(currentMember.vkId);
    setSelectedPartnerIds(currentMember.preferredWithIds || []);
    setAvoidedPartnerIds(currentMember.avoidedWithIds || []);
    setDesiredRoles(currentMember.desiredRoles || []);
  }, [
    currentMember.id,
    currentMember.role,
    currentMember.vkId,
    JSON.stringify(currentMember.preferredWithIds),
    JSON.stringify(currentMember.avoidedWithIds),
    JSON.stringify(currentMember.desiredRoles),
  ]);

  const activeRoleDef = ROLES[viewedRoleType] || ROLES[currentMember.role];
  const myGroup = groups.find((g) => g.id === currentMember.groupId);
  const crewMembers = myGroup
    ? allParticipants.filter((p) => p.groupId === myGroup.id && p.id !== currentMember.id)
    : [];

  // Save VK updates
  const handleSaveVk = () => {
    let clean = tempVkId.trim();
    if (clean.startsWith('https://vk.com/')) {
      clean = clean.replace('https://vk.com/', '');
    }
    const finalUrl = `https://vk.com/${clean}`;
    onUpdateMemberVk(currentMember.id, clean, finalUrl);
    setIsEditingVk(false);
  };

  // Toggle desired role for curator
  const handleToggleDesiredRole = (roleType: RoleType) => {
    let updated: RoleType[];
    if (desiredRoles.includes(roleType)) {
      updated = desiredRoles.filter((r) => r !== roleType);
    } else {
      if (desiredRoles.length >= 3) {
        updated = [...desiredRoles.slice(1), roleType];
      } else {
        updated = [...desiredRoles, roleType];
      }
    }
    setDesiredRoles(updated);
    onUpdateMemberPreferences(currentMember.id, selectedPartnerIds, avoidedPartnerIds, updated);
    setIsSavedDesiredRoles(true);
    setTimeout(() => setIsSavedDesiredRoles(false), 2500);
  };

  // Toggle preferred partner (automatically removes from avoided list if present)
  const handleTogglePreferredPartner = (partnerId: string) => {
    let updatedPreferred: string[];
    let updatedAvoided = avoidedPartnerIds.filter((id) => id !== partnerId);

    if (selectedPartnerIds.includes(partnerId)) {
      updatedPreferred = selectedPartnerIds.filter((id) => id !== partnerId);
    } else {
      updatedPreferred = [...selectedPartnerIds, partnerId];
    }

    setSelectedPartnerIds(updatedPreferred);
    setAvoidedPartnerIds(updatedAvoided);
    onUpdateMemberPreferences(currentMember.id, updatedPreferred, updatedAvoided, desiredRoles);
  };

  // Toggle avoided partner (automatically removes from preferred list if present)
  const handleToggleAvoidedPartner = (partnerId: string) => {
    let updatedAvoided: string[];
    let updatedPreferred = selectedPartnerIds.filter((id) => id !== partnerId);

    if (avoidedPartnerIds.includes(partnerId)) {
      updatedAvoided = avoidedPartnerIds.filter((id) => id !== partnerId);
    } else {
      updatedAvoided = [...avoidedPartnerIds, partnerId];
    }

    setAvoidedPartnerIds(updatedAvoided);
    setSelectedPartnerIds(updatedPreferred);
    onUpdateMemberPreferences(currentMember.id, updatedPreferred, updatedAvoided, desiredRoles);
  };

  // Toggle checklist item
  const handleToggleChecklistItem = (itemText: string) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [itemText]: !prev[itemText],
    }));
  };

  // Format and copy complete role guidelines
  const handleCopyGuideline = () => {
    const lines = [
      `🎬 РЕГЛАМЕНТ И ПАМЯТКА РОЛИ | ${activeRoleDef.title.toUpperCase()}`,
      `Кинолаборатория 2026 (Студенческий короткий метр)`,
      ``,
      `📌 ОПИСАНИЕ РОЛИ:`,
      activeRoleDef.description,
      ``,
      `📋 БАЗОВЫЕ ОБЯЗАННОСТИ:`,
      ...activeRoleDef.responsibilities.map((r, i) => `${i + 1}. ${r}`),
      ``,
    ];

    if (activeRoleDef.studentFocus) {
      if (activeRoleDef.studentFocus.critical && activeRoleDef.studentFocus.critical.length > 0) {
        lines.push(`🟢 КРИТИЧЕСКИ ВАЖНО ДЛЯ СТУДЕНЧЕСКОГО ПРОЕКТА:`);
        activeRoleDef.studentFocus.critical.forEach((c) => lines.push(`• ${c}`));
        lines.push(``);
      }
      if (activeRoleDef.studentFocus.unimportant && activeRoleDef.studentFocus.unimportant.length > 0) {
        lines.push(`🔴 ВТОРОСТЕПЕННО / ЧАСТЫЕ ОШИБКИ НОВИЧКОВ (НЕ ТРАТЬТЕ СИЛЫ!):`);
        activeRoleDef.studentFocus.unimportant.forEach((u) => lines.push(`• ${u}`));
        lines.push(``);
      }
      if (activeRoleDef.studentFocus.studentTips && activeRoleDef.studentFocus.studentTips.length > 0) {
        lines.push(`💡 ЛАЙФХАКИ СТУДЕНЧЕСКОЙ СЪЁМКИ:`);
        activeRoleDef.studentFocus.studentTips.forEach((t) => lines.push(`• ${t}`));
        lines.push(``);
      }
    }

    if (activeRoleDef.stageBreakdown) {
      lines.push(`⏱️ ОБЯЗАННОСТИ ПО ЭТАПАМ КИНОПРОИЗВОДСТВА:`);
      activeRoleDef.stageBreakdown.forEach((stage) => {
        lines.push(`\n[${stage.stageTitle}]`);
        stage.duties.forEach((d) => lines.push(`• ${d}`));
      });
      lines.push(``);
    }

    if (activeRoleDef.recommendedBooks && activeRoleDef.recommendedBooks.length > 0) {
      lines.push(`📚 РЕКОМЕНДУЕМЫЕ КНИГИ ДЛЯ ЧТЕНИЯ:`);
      activeRoleDef.recommendedBooks.forEach((b, i) => {
        lines.push(`${i + 1}. «${b.title}» (${b.author}) — ${b.whyRead}`);
      });
      lines.push(``);
    }

    if (activeRoleDef.deliverables && activeRoleDef.deliverables.length > 0) {
      lines.push(`📦 ОБЯЗАТЕЛЬНЫЕ СДАВАЕМЫЕ МАТЕРИАЛЫ (АРТЕФАКТЫ):`);
      activeRoleDef.deliverables.forEach((del, i) => {
        lines.push(`${i + 1}. ${del.name} (Формат: ${del.format}) — Срок: ${del.deadlineDescription}`);
      });
      lines.push(``);
    }

    if (activeRoleDef.shiftChecklist && activeRoleDef.shiftChecklist.length > 0) {
      lines.push(`✅ ЧЕК-ЛИСТ СЪЁМОЧНОЙ СМЕНЫ:`);
      activeRoleDef.shiftChecklist.forEach((chk) => lines.push(`[ ] ${chk}`));
      lines.push(``);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedGuideline(true);
    setTimeout(() => setCopiedGuideline(false), 2500);
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-center space-y-5 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <div className="inline-block px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs font-mono mb-2">
            Табельный номер: {currentMember.id}
          </div>
          <h2 className="text-xl font-bold text-white">
            Кабинет участника: {currentMember.name}
          </h2>
          <div className="text-xs text-blue-300 font-medium mt-1">
            {ROLES[currentMember.role]?.title || currentMember.role}
          </div>
          <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
            Этот личный кабинет защищён персональным PIN-кодом, чтобы посторонние не могли случайно получить доступ к вашим стоп-листам, пожеланиям и задачам.
          </p>
        </div>

        <form onSubmit={handleUnlockCabinet} className="space-y-3.5 text-left">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center justify-between">
              <span>Личный PIN-код:</span>
              <span className="text-[11px] text-zinc-400 font-mono">4-значный код доступа</span>
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={8}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(null);
                }}
                placeholder="Введите PIN-код..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {pinError && (
            <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-xs text-rose-200 text-center animate-shake">
              {pinError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            Войти в личный кабинет
          </button>
        </form>

        <div className="pt-2 text-[11px] text-zinc-400 border-t border-zinc-800 leading-relaxed">
          Забыли личный PIN-код? Обратитесь к куратору лаборатории для верификации и восстановления доступа.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1800px] 2xl:max-w-[2100px] mx-auto">
      {/* Top Switcher Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">
              Личный кабинет участника кинолаборатории
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>{currentMember.name}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {currentMember.id}
              </span>
              <button
                onClick={() => onEditParticipant(currentMember)}
                title="Редактировать профиль участника"
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Access & Switcher Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto min-w-0">
          {userRole === 'admin' ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto min-w-0">
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Куратор</span>
              </span>
              <select
                value={currentMember.id}
                onChange={(e) => {
                  const selected = allParticipants.find((p) => p.id === e.target.value);
                  if (selected) {
                    onSelectMember(selected);
                  }
                }}
                className="w-full sm:w-auto max-w-full min-w-0 truncate bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-500 font-medium"
              >
                {allParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({ROLES[p.role]?.shortTitle || p.role}) — {p.id}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Защищён</span>
              </span>
              <button
                onClick={() => setIsChangePinOpen(true)}
                title="Сменить персональный PIN-код кабинета"
                className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 rounded-lg transition-colors flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3 text-zinc-400" />
                <span>Сменить PIN</span>
              </button>
              <button
                onClick={handleLockCabinet}
                title="Заблокировать доступ при уходе от компьютера"
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-rose-400 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg transition-colors"
              >
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout: Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Profile Info & Quick Summary */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">{currentMember.name}</h3>
              <div className="text-xs text-zinc-300 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 inline-block mt-1 font-semibold">
                {ROLES[currentMember.role]?.title || currentMember.role}
              </div>
              <div className="text-xs text-zinc-400 mt-1.5 font-mono">
                Табельный номер: {currentMember.id}
              </div>

              {/* Особые умения участника (под табельным номером) */}
              <div className="mt-3.5 pt-3 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Особые умения:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {isSavedSkillsFeedback && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-fade-in font-medium">
                        <Check className="w-3 h-3" /> Сохранено
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingSkills(!isEditingSkills)}
                      className="text-zinc-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                      title="Редактировать особые умения"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingSkills ? 'Готово' : (skillsList.length > 0 ? 'Изменить' : 'Добавить')}</span>
                    </button>
                  </div>
                </div>

                {/* Чипы с особыми умениями */}
                {skillsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-lg text-xs font-medium text-zinc-200 shadow-xs"
                      >
                        <span>{skill}</span>
                        {isEditingSkills && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            title={`Удалить «${skill}»`}
                            className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 rounded hover:bg-zinc-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  !isEditingSkills && (
                    <div className="text-xs text-zinc-500 italic">
                      Не указаны (например: пою, танцую, знаю IT, программирую)
                    </div>
                  )
                )}

                {/* Форма добавления умений при редактировании */}
                {isEditingSkills && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSingleSkill();
                          }
                        }}
                        placeholder="Пою, танцую, знаю IT, программирую..."
                        className="flex-1 bg-zinc-950 border border-zinc-700 text-xs px-2.5 py-1.5 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSingleSkill()}
                        disabled={!newSkillInput.trim()}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Добавить</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-tight">
                      Укажите ваши таланты (можно перечислить несколько через запятую).
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* VK link row */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">
                  ВКонтакте (VK ID):
                </span>
                <button
                  onClick={() => setIsEditingVk(!isEditingVk)}
                  className="text-zinc-400 hover:text-white text-xs flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingVk ? 'Отмена' : 'Изменить'}</span>
                </button>
              </div>

              {isEditingVk ? (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={tempVkId}
                    onChange={(e) => setTempVkId(e.target.value)}
                    placeholder="ivan_filmmaker или id123"
                    className="w-full bg-zinc-900 border border-zinc-700 text-xs px-2.5 py-1.5 rounded-lg text-zinc-200 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveVk}
                    className="w-full py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-colors"
                  >
                    Сохранить VK
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono text-zinc-300 truncate max-w-[170px]">
                    @{currentMember.vkId}
                  </span>
                  <a
                    href={currentMember.vkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Открыть VK</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* PIN Code Security Card */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Личный PIN-код:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePinOpen(true);
                    setNewPinValue('');
                    setChangePinError(null);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium hover:underline"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Сменить</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tracking-widest text-emerald-400 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {showCurrentPinInProfile ? (currentMember.pinCode || '----') : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPinInProfile(!showCurrentPinInProfile)}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title={showCurrentPinInProfile ? 'Скрыть PIN' : 'Показать PIN'}
                  >
                    {showCurrentPinInProfile ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentMember.pinCode) {
                      navigator.clipboard.writeText(currentMember.pinCode);
                    }
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                  title="Скопировать PIN-код в буфер обмена"
                >
                  <Copy className="w-3 h-3" />
                  <span>Копировать</span>
                </button>
              </div>
            </div>
          </div>


          {/* Assigned Role (Approved by Curator) Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Закреплённая роль в группе</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1 shadow-sm">
                <span>✓ Утверждено куратором</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-${ROLES[currentMember.role]?.color || 'zinc'}-400`} />
                <span>{ROLES[currentMember.role]?.title}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-900">
                <span>Команда:</span>
                <b className="text-zinc-200">
                  {myGroup ? myGroup.name : 'Резерв лаборатории'}
                </b>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                Куратор кинолаборатории закрепил вас за этим цехом. На площадке вы выполняете задачи данной роли.
              </p>
            </div>

            {desiredRoles.length > 0 && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                desiredRoles.includes(currentMember.role)
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}>
                {desiredRoles.includes(currentMember.role) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Закреплённая роль <b>совпадает</b> с вашим пожеланием!</span>
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Пожелания ({desiredRoles.map((r) => ROLES[r]?.shortTitle || r).join(', ')}) отправлены куратору.</span>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (onOpenRoleGuidelines) {
                  onOpenRoleGuidelines(currentMember.role);
                } else {
                  setViewedRoleType(currentMember.role);
                  const el = document.getElementById('role-detailed-guideline');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full py-2 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-amber-800/60 shadow-sm"
              title="Открыть интерактивную памятку всех 12 цехов с чек-листами смен и лайфхаками"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Открыть памятку цеха (12 цехов) →</span>
            </button>
          </div>

          {/* Desired Roles (Set by Participant for Curator) Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Желаемые роли (для куратора)</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {desiredRoles.length}/3 выбрано
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Отметьте до 3 ролей, которые вы хотите попробовать. Куратор видит эти предпочтения на доске групп при формировании команд:
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(ROLES).map((r) => {
                const isSelected = desiredRoles.includes(r.type);
                const isApproved = currentMember.role === r.type;

                return (
                  <button
                    key={r.type}
                    type="button"
                    onClick={() => handleToggleDesiredRole(r.type)}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between gap-1 text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-700 text-indigo-200 font-semibold shadow-sm'
                        : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="truncate">{r.shortTitle}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isApproved && (
                        <span title="Текущая закреплённая куратором роль" className="text-[9px] px-1 rounded bg-zinc-800 text-emerald-400 font-mono">
                          курат.
                        </span>
                      )}
                      {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {isSavedDesiredRoles && (
              <div className="p-2 rounded bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-300 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Пожелания сохранены и видны куратору!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Film Crew & Preferences */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-8 space-y-5">
          {/* Film Crew Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-zinc-400" />
                <h4 className="text-base font-bold text-white">
                  Съёмочная группа
                </h4>
              </div>
              {myGroup ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200">
                  {myGroup.name}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-md bg-zinc-950 text-zinc-500 border border-zinc-800">
                  В резерве
                </span>
              )}
            </div>

            {myGroup ? (
              <div className="space-y-4">
                {/* VK Group Chat Button */}
                {myGroup.vkChatUrl ? (
                  <a
                    href={myGroup.vkChatUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-semibold text-white">Общая беседа съёмочной группы в VK</span>
                    </div>
                    <span className="text-zinc-400 hover:text-white flex items-center gap-1">
                      <span>Перейти в чат</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                ) : (
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-500 flex items-center justify-between">
                    <span>Ссылка на беседу в VK пока не указана куратором</span>
                  </div>
                )}

                {/* Team roster */}
                <div>
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Команда ({crewMembers.length + 1} чел.):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {crewMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-850"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {member.name}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {ROLES[member.role]?.shortTitle || member.role}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setViewedRoleType(member.role);
                              const el = document.getElementById('role-detailed-guideline');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            title={`Посмотреть регламент роли ${ROLES[member.role]?.shortTitle}`}
                            className="text-[11px] text-zinc-400 hover:text-white underline"
                          >
                            Роль
                          </button>
                          <a
                            href={member.vkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 transition-colors"
                          >
                            <span>VK</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400">
                Вы находитесь в резерве. Куратор распределит вас в группу после собрания.
              </div>
            )}
          </div>

          {/* Preferences and Stop-list */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4">
            {/* Warning if current group has members from stop-list */}
            {(() => {
              const myAvoidedInGroup = crewMembers.filter((m) => avoidedPartnerIds.includes(m.id));
              const otherAvoidedMeInGroup = crewMembers.filter(
                (m) => !avoidedPartnerIds.includes(m.id) && (m.avoidedWithIds || []).includes(currentMember.id)
              );

              if (myAvoidedInGroup.length === 0 && otherAvoidedMeInGroup.length === 0) return null;

              return (
                <div className="p-3.5 bg-rose-950/60 border border-rose-800/90 rounded-xl space-y-2 text-xs text-rose-200">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <div className="font-bold text-rose-100 text-sm">
                        Обнаружено нежелательное соседство в текущей группе «{myGroup?.name}»!
                      </div>
                      {myAvoidedInGroup.length > 0 && (
                        <div className="text-rose-300 flex items-center justify-between gap-2 flex-wrap bg-rose-950/40 p-2 rounded-lg border border-rose-900/60">
                          <span>
                            Вы указали в своём стоп-листе:{' '}
                            <b className="underline text-white">{myAvoidedInGroup.map((m) => m.name).join(', ')}</b>
                          </span>
                          {onRemoveAvoidLink && (
                            <button
                              type="button"
                              onClick={() => myAvoidedInGroup.forEach((m) => onRemoveAvoidLink(currentMember.id, m.id))}
                              className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-white font-medium text-[11px]"
                            >
                              Убрать из своего стоп-листа
                            </button>
                          )}
                        </div>
                      )}
                      {otherAvoidedMeInGroup.length > 0 && (
                        <div className="text-rose-300 flex items-center justify-between gap-2 flex-wrap bg-rose-950/40 p-2 rounded-lg border border-rose-900/60">
                          <span>
                            Коллега внёс(ла) вас в свой стоп-лист:{' '}
                            <b className="underline text-white">{otherAvoidedMeInGroup.map((m) => m.name).join(', ')}</b>
                          </span>
                          {onRemoveAvoidLink && (
                            <button
                              type="button"
                              onClick={() => otherAvoidedMeInGroup.forEach((m) => onRemoveAvoidLink(m.id, currentMember.id))}
                              className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-850 text-white font-medium text-[11px]"
                            >
                              Снять ограничение
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Preference Tabs: Want vs Do NOT want */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreferenceTab('preferred')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    preferenceTab === 'preferred'
                      ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200 shadow-sm'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                  <span>С кем хочу работать</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-900/60 text-emerald-300 font-mono font-bold">
                    {selectedPartnerIds.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferenceTab('avoided')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    preferenceTab === 'avoided'
                      ? 'bg-rose-950/80 border border-rose-700 text-rose-200 shadow-sm'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Стоп-лист (не хочу работать)</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-900/60 text-rose-300 font-mono font-bold">
                    {avoidedPartnerIds.length}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-zinc-400">
                {preferenceTab === 'preferred' ? (
                  <span className="text-emerald-400/90 font-medium">
                    ✓ Зелёный список: приоритет для авто-балансировщика
                  </span>
                ) : (
                  <span className="text-rose-400/90 font-medium">
                    ⛔ Красный список: строго запрещено ставить в одну группу
                  </span>
                )}
              </div>
            </div>

            {/* Description depending on active tab */}
            <div>
              {preferenceTab === 'preferred' ? (
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Пожелания по напарникам (с кем хочу снимать)</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Отметьте коллег, с кем у вас есть творческий контакт. При авто-балансировке
                    система постарается объединить вас в одну команду.
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-rose-300">Стоп-лист (с кем категорически НЕ хочу работать)</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Укажите людей, с кем вы категорически не хотите быть в одной съёмочной группе.
                    Куратор и алгоритм гарантируют разведение по разным картинам.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Filter Search for Partners */}
            <div className="relative">
              <input
                type="text"
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                placeholder="Поиск по имени или роли (например: оператор, Режиссёр, Вероника)..."
                className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-600"
              />
              {partnerSearch && (
                <button
                  type="button"
                  onClick={() => setPartnerSearch('')}
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Selected Chips: Preferred List */}
            {preferenceTab === 'preferred' && selectedPartnerIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-zinc-950/70 rounded-lg border border-zinc-800/80">
                <span className="text-[11px] text-zinc-400 font-semibold self-center mr-1">
                  Хочу работать:
                </span>
                {selectedPartnerIds.map((id) => {
                  const p = allParticipants.find((item) => item.id === id);
                  if (!p) return null;
                  const isMutual = p.preferredWithIds.includes(currentMember.id);

                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                    >
                      <span className="font-medium">{p.name}</span>
                      {isMutual && (
                        <span
                          title="Взаимный выбор! Участник также отметил вас"
                          className="px-1 text-[10px] bg-emerald-900/80 text-emerald-300 rounded font-bold"
                        >
                          Взаимно ❤️
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTogglePreferredPartner(id)}
                        className="text-zinc-400 hover:text-red-400 ml-0.5"
                        title="Удалить из предпочтений"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Selected Chips: Avoided List */}
            {preferenceTab === 'avoided' && avoidedPartnerIds.length > 0 && (
              <div className="p-2.5 bg-rose-950/30 rounded-lg border border-rose-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-rose-300 font-semibold">
                    Стоп-лист (не хочу работать): {avoidedPartnerIds.length} чел.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAvoidedPartnerIds([]);
                      onUpdateMemberPreferences(currentMember.id, selectedPartnerIds, []);
                    }}
                    className="text-[11px] text-rose-400 hover:text-white underline"
                  >
                    Очистить весь стоп-лист
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {avoidedPartnerIds.map((id) => {
                    const p = allParticipants.find((item) => item.id === id);
                    if (!p) return null;
                    const isMutual = (p.avoidedWithIds || []).includes(currentMember.id);

                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/80 border border-rose-800 text-xs text-rose-200"
                      >
                        <span className="font-medium">{p.name}</span>
                        {isMutual && (
                          <span
                            title="Взаимный стоп-лист! Этот человек тоже не хочет быть с вами в группе"
                            className="px-1 text-[10px] bg-rose-900 text-rose-100 rounded font-bold"
                          >
                            Взаимно ⚡
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleAvoidedPartner(id)}
                          className="text-rose-400 hover:text-white ml-0.5"
                          title="Убрать из стоп-листа"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary chips preview for BOTH when either has entries */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 pt-1">
              <span>Статус сохранения:</span>
              <span className="text-zinc-300">
                ❤️ Желаемых: <b>{selectedPartnerIds.length}</b>
              </span>
              <span>•</span>
              <span className="text-rose-400">
                🚫 В стоп-листе: <b>{avoidedPartnerIds.length}</b>
              </span>
              <span>•</span>
              <span className="text-zinc-500">
                Выбор сохраняется моментально в облаке
              </span>
            </div>

            {/* Partners List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-2.5 pt-1 max-h-72 overflow-y-auto pr-1">
              {allParticipants
                .filter((p) => p.id !== currentMember.id)
                .filter((p) => {
                  if (!partnerSearch.trim()) return true;
                  const query = partnerSearch.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(query) ||
                    p.role.toLowerCase().includes(query) ||
                    (ROLES[p.role]?.title || '').toLowerCase().includes(query)
                  );
                })
                .map((p) => {
                  const isPreferred = selectedPartnerIds.includes(p.id);
                  const isAvoided = avoidedPartnerIds.includes(p.id);
                  const isMutualPreferred = p.preferredWithIds.includes(currentMember.id);
                  const isMutualAvoided = (p.avoidedWithIds || []).includes(currentMember.id);

                  if (preferenceTab === 'preferred') {
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleTogglePreferredPartner(p.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors text-xs ${
                          isPreferred
                            ? 'bg-emerald-950/50 border-emerald-600 text-white shadow-sm'
                            : isAvoided
                            ? 'bg-zinc-950/70 border-rose-900/40 text-zinc-400 hover:border-zinc-700 opacity-60'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-medium text-white truncate flex items-center gap-1">
                            <span>{p.name}</span>
                            {isMutualPreferred && (
                              <span
                                title="Взаимный выбор! Этот человек тоже указал вас в предпочтениях"
                                className="text-[10px] text-emerald-400 font-bold shrink-0"
                              >
                                ★
                              </span>
                            )}
                            {isAvoided && (
                              <span
                                title="Сейчас в вашем стоп-листе"
                                className="text-[9px] text-rose-400 shrink-0 font-bold"
                              >
                                (в стоп-листе)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {ROLES[p.role]?.shortTitle || p.role}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {isPreferred ? (
                            <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded border border-zinc-700 text-transparent hover:border-zinc-500" />
                          )}
                        </div>
                      </button>
                    );
                  } else {
                    // Avoided tab mode
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleToggleAvoidedPartner(p.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors text-xs ${
                          isAvoided
                            ? 'bg-rose-950/60 border-rose-600 text-rose-100 shadow-sm'
                            : isPreferred
                            ? 'bg-zinc-950/70 border-emerald-900/40 text-zinc-400 hover:border-zinc-700 opacity-60'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-medium text-white truncate flex items-center gap-1">
                            <span className={isAvoided ? 'text-rose-200 font-bold' : ''}>
                              {p.name}
                            </span>
                            {isMutualAvoided && (
                              <span
                                title="Взаимный запрет! Этот человек тоже внёс вас в стоп-лист"
                                className="text-[10px] text-rose-400 font-bold shrink-0"
                              >
                                ⚡
                              </span>
                            )}
                            {isPreferred && (
                              <span
                                title="Сейчас в вашем списке желаемых"
                                className="text-[9px] text-emerald-400 shrink-0 font-bold"
                              >
                                (в желаемых)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {ROLES[p.role]?.shortTitle || p.role}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {isAvoided ? (
                            <div className="w-5 h-5 rounded bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                              <Ban className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded border border-zinc-700 text-transparent hover:border-zinc-500" />
                          )}
                        </div>
                      </button>
                    );
                  }
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Role Guideline & Responsibilities Section */}
      <div
        id="role-detailed-guideline"
        className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg space-y-0"
      >
        {/* Header with Role Selector and Actions */}
        <div className="p-5 sm:p-6 bg-zinc-950/70 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Профессиональный регламент роли: {activeRoleDef.title}
                </h3>
                {viewedRoleType === currentMember.role ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/80 font-medium">
                    Ваша текущая роль
                  </span>
                ) : (
                  <button
                    onClick={() => setViewedRoleType(currentMember.role)}
                    className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 underline"
                  >
                    Вернуться к моей роли ({ROLES[currentMember.role]?.shortTitle})
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                {activeRoleDef.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto min-w-0">
            {/* View other role selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full sm:w-auto min-w-0">
              <span className="text-xs text-zinc-400 shrink-0">
                Сменить цех:
              </span>
              <select
                value={viewedRoleType}
                onChange={(e) => setViewedRoleType(e.target.value as RoleType)}
                className="w-full sm:w-auto max-w-full min-w-0 truncate bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-zinc-500 font-medium"
              >
                {Object.values(ROLES).map((r) => (
                  <option key={r.type} value={r.type}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {/* Open dedicated guidelines view button */}
              {onOpenRoleGuidelines && (
                <button
                  onClick={() => onOpenRoleGuidelines(viewedRoleType)}
                  title="Перейти в полноэкранный каталог памяток 12 цехов"
                  className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-amber-800/80 shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Все 12 цехов →</span>
                </button>
              )}

              {/* Copy button */}
              <button
                onClick={handleCopyGuideline}
                title="Скопировать полный регламент роли в буфер обмена"
                className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border border-zinc-700/60"
              >
                {copiedGuideline ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Guideline Sections Switcher (sm:hidden) */}
        <div className="sm:hidden p-3.5 bg-zinc-950/80 border-b border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Раздел регламента роли:</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {guidelineTab === 'focus' ? '1 из 6' :
               guidelineTab === 'stages' ? '2 из 6' :
               guidelineTab === 'books' ? '3 из 6' :
               guidelineTab === 'deliverables' ? '4 из 5' : '5 из 5'}
            </span>
          </div>

          <select
            value={guidelineTab}
            onChange={(e) => setGuidelineTab(e.target.value as any)}
            className="w-full bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="focus">💡 1. Студенческий фокус (Важное / Неважное)</option>
            <option value="stages">📅 2. Обязанности по этапам (Пре / Съёмки / Пост)</option>
            <option value="books">📚 3. Книжная полка цеха ({cabinetRoleBooks.length})</option>
            <option value="deliverables">📁 4. Сдаваемые материалы ({activeRoleDef.deliverables?.length || 0})</option>
            <option value="checklist">✅ 5. Чек-лист съёмочной смены</option>
          </select>

          {/* 5 Quick Category Buttons Grid (100% visible on mobile, no cut-off) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setGuidelineTab('focus')}
              className={`py-2 px-1.5 rounded-lg text-[11px] font-medium transition-colors text-center truncate ${
                guidelineTab === 'focus'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              💡 Фокус
            </button>
            <button
              type="button"
              onClick={() => setGuidelineTab('stages')}
              className={`py-2 px-1.5 rounded-lg text-[11px] font-medium transition-colors text-center truncate ${
                guidelineTab === 'stages'
                  ? 'bg-zinc-800 text-white border border-zinc-650 font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              📅 Этапы
            </button>
            <button
              type="button"
              onClick={() => setGuidelineTab('books')}
              className={`py-2 px-1.5 rounded-lg text-[11px] font-medium transition-colors text-center truncate ${
                guidelineTab === 'books'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              📚 Книги
            </button>
            <button
              type="button"
              onClick={() => setGuidelineTab('deliverables')}
              className={`py-2 px-1.5 rounded-lg text-[11px] font-medium transition-colors text-center truncate ${
                guidelineTab === 'deliverables'
                  ? 'bg-zinc-800 text-white border border-zinc-650 font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              📁 Сдача
            </button>
            <button
              type="button"
              onClick={() => setGuidelineTab('checklist')}
              className={`py-2 px-1.5 rounded-lg text-[11px] font-medium transition-colors text-center truncate col-span-2 sm:col-span-1 ${
                guidelineTab === 'checklist'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              ✅ Чек-лист
            </button>
          </div>
        </div>

        {/* Desktop Tabs (hidden sm:flex, with no-scrollbar) */}
        <div className="hidden sm:flex border-b border-zinc-800 bg-zinc-950/40 px-5 pt-3 gap-2 overflow-x-auto text-xs font-semibold no-scrollbar">
          <button
            onClick={() => setGuidelineTab('focus')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              guidelineTab === 'focus'
                ? 'border-emerald-400 text-emerald-300 bg-zinc-900 shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            <span>Студенческий фокус (Важное / Неважное)</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              Фокус
            </span>
          </button>

          <button
            onClick={() => setGuidelineTab('stages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              guidelineTab === 'stages'
                ? 'border-white text-white bg-zinc-900 shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Обязанности по этапам (Пре / Съёмки / Пост)</span>
          </button>

          <button
            onClick={() => setGuidelineTab('books')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              guidelineTab === 'books'
                ? 'border-indigo-400 text-indigo-300 bg-zinc-900 shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-indigo-400" />
            <span>Книжная полка цеха ({cabinetRoleBooks.length})</span>
          </button>

          <button
            onClick={() => setGuidelineTab('deliverables')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              guidelineTab === 'deliverables'
                ? 'border-white text-white bg-zinc-900 shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Сдаваемые материалы и артефакты ({activeRoleDef.deliverables?.length || 0})</span>
          </button>

          <button
            onClick={() => setGuidelineTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              guidelineTab === 'checklist'
                ? 'border-white text-white bg-zinc-900 shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Чек-лист готовности к съёмочной смене</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {/* Tab: Student Focus (Critical vs Unimportant & Tips) */}
          {guidelineTab === 'focus' && (
            <div className="space-y-6">
              {/* Intro Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-indigo-950/30 border border-emerald-800/40 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-900/40 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                    <span>Памятка кинолаборатории: Специфика студенческого проекта</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-700/50 font-normal">
                      Короткий метр • Непрофильный опыт • Свободное время
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Здесь собрана выжимка опыта съёмок силами студентов, которые совмещают проект с учёбой и сессией. 
                    Определите приоритеты: на что направить 80% внимания, а на что <b>не тратить драгоценные силы и нервы</b>.
                  </p>
                </div>
              </div>

              {/* 1. Critical Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>🟢 Критически важно для студенческого проекта (Фокус №1)</span>
                  </h5>
                  <span className="text-[11px] text-zinc-500">Без этого фильм не состоится</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeRoleDef.studentFocus?.critical?.map((crit, idx) => {
                    const parts = crit.split(':');
                    const title = parts.length > 1 ? parts[0] : `Правило ${idx + 1}`;
                    const desc = parts.length > 1 ? parts.slice(1).join(':') : crit;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-zinc-950 border border-emerald-900/60 hover:border-emerald-700/70 transition-colors flex flex-col justify-between space-y-2 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-emerald-200">
                              {title}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed pl-7">
                            {desc.trim()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Unimportant / Traps Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>🔴 Второстепенно / Не тратьте силы! (Частые ловушки новичков)</span>
                  </h5>
                  <span className="text-[11px] text-zinc-500">Ошибки, сжигающие смену</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeRoleDef.studentFocus?.unimportant?.map((unimp, idx) => {
                    const parts = unimp.split(':');
                    const title = parts.length > 1 ? parts[0] : `Ловушка ${idx + 1}`;
                    const desc = parts.length > 1 ? parts.slice(1).join(':') : unimp;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-zinc-950 border border-rose-950/80 hover:border-rose-900/80 transition-colors flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-5 h-5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                              ✕
                            </span>
                            <span className="text-xs font-bold text-rose-200">
                              {title}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed pl-7">
                            {desc.trim()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Student Tips / Hacks */}
              {activeRoleDef.studentFocus?.studentTips && activeRoleDef.studentFocus.studentTips.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-sky-400" />
                      <span>💡 Лайфхаки съёмок для непрофессионалов</span>
                    </h5>
                    <span className="text-[11px] text-zinc-500">Практика кинолаборатории</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeRoleDef.studentFocus.studentTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-sky-950/80 flex items-start gap-3"
                      >
                        <div className="p-1.5 rounded-lg bg-sky-950 text-sky-400 shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Stages Breakdown */}
          {guidelineTab === 'stages' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeRoleDef.stageBreakdown ? (
                  activeRoleDef.stageBreakdown.map((stg, idx) => {
                    const icon =
                      stg.stage === 'pre_production' ? (
                        <Calendar className="w-4 h-4 text-amber-400" />
                      ) : stg.stage === 'production' ? (
                        <Camera className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Scissors className="w-4 h-4 text-sky-400" />
                      );

                    return (
                      <div
                        key={idx}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-bold text-sm text-white mb-2">
                            {icon}
                            <span>{stg.stageTitle}</span>
                          </div>
                          <div className="space-y-2 pt-1">
                            {stg.duties.map((duty, dIdx) => (
                              <div
                                key={dIdx}
                                className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed"
                              >
                                <span className="text-zinc-500 mt-1 shrink-0">•</span>
                                <span>{duty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center text-xs text-zinc-500 p-4">
                    Данные по этапам формируются.
                  </div>
                )}
              </div>

              {/* General Responsibilities Summary */}
              <div className="pt-4 border-t border-zinc-800">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2.5">
                  Базовые стандарты роли {activeRoleDef.shortTitle}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeRoleDef.responsibilities.map((resp, i) => (
                    <div
                      key={i}
                      className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5"
                    >
                      <span className="font-mono text-zinc-500 font-bold shrink-0 mt-0.5">
                        0{i + 1}.
                      </span>
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Recommended Books */}
          {guidelineTab === 'books' && (
            <div className="space-y-6">
              {/* Books Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-zinc-950 to-purple-950/30 border border-indigo-800/40 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-900/40 border border-indigo-700/60 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                    <span>Книжная полка цеха «{activeRoleDef.title}»</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-900/70 text-indigo-300 border border-indigo-700/50 font-normal">
                      Самообразование в свободное время
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Эти книги написаны признанными практиками мирового кинематографа. В них нет сухого академизма — они читаются на одном дыхании за пару вечеров и дают кристальное понимание профессии для студентов любого профиля.
                  </p>
                </div>
              </div>

              {/* Books Grid */}
              <div className="space-y-4">
                {userRole === 'admin' && (
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs text-indigo-300 font-semibold">Управление книгами цеха:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (confirm('Восстановить исходный список книг для этого цеха?')) {
                            resetBooksForRole(viewedRoleType);
                          }
                        }}
                        title="Сбросить список книг этого цеха к базовым"
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCabinetBook(null);
                          setEditingCabinetBookIndex(null);
                          setIsCabinetBookModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить книгу</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cabinetRoleBooks && cabinetRoleBooks.length > 0 ? (
                    cabinetRoleBooks.map((book, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-700/60 transition-colors shadow-sm relative group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 uppercase tracking-wider">
                              Книга #{idx + 1}
                            </span>

                            {userRole === 'admin' ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingCabinetBook(book);
                                    setEditingCabinetBookIndex(idx);
                                    setIsCabinetBookModalOpen(true);
                                  }}
                                  title="Редактировать книгу"
                                  className="p-1 text-zinc-400 hover:text-indigo-300 rounded hover:bg-zinc-900 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Удалить книгу «${book.title}»?`)) {
                                      deleteBookFromRole(viewedRoleType, idx);
                                    }
                                  }}
                                  title="Удалить книгу"
                                  className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-900 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-500 font-mono">
                                Маст-хэв
                              </span>
                            )}
                          </div>

                          <div>
                            <h5 className="font-bold text-white text-sm leading-snug">
                              «{book.title}»
                            </h5>
                            <div className="text-xs text-indigo-400 font-medium mt-0.5">
                              {book.author}
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-850 text-xs text-zinc-300 leading-relaxed">
                            <span className="font-semibold text-zinc-400 block mb-1">
                              Почему стоит прочесть студенту:
                            </span>
                            {book.whyRead}
                          </div>
                        </div>

                        {/* Download Book Document */}
                        <div className="space-y-2 pt-2 border-t border-zinc-850">
                          {book.fileName || book.fileData || book.fileUrl ? (
                            <div className="space-y-1.5">
                              <button
                                type="button"
                                onClick={() => triggerBookDownload(book)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="truncate">Скачать книгу {book.fileName ? `(${book.fileName})` : '(.pdf)'}</span>
                                {book.fileSize && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-700 text-indigo-200 text-[10px] font-mono font-normal shrink-0">
                                    {book.fileSize}
                                  </span>
                                )}
                              </button>

                              {book.fileUrl && (
                                <a
                                  href={book.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                                >
                                  <span>Открыть на облачном диске</span>
                                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[11px] text-zinc-500">
                              <span>Файл пока не прикреплен</span>
                              {userRole === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCabinetBook(book);
                                    setEditingCabinetBookIndex(idx);
                                    setIsCabinetBookModalOpen(true);
                                  }}
                                  className="text-indigo-400 hover:text-indigo-300 font-medium underline"
                                >
                                  + Загрузить PDF
                                </button>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-850/60">
                            <span>Рекомендовано кураторами</span>
                            <span className="text-indigo-400 font-medium">Кинолаборатория</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center text-xs text-zinc-500 p-6 bg-zinc-950 rounded-xl border border-zinc-800">
                      Список рекомендуемой литературы пока пуст.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Deliverables */}
          {guidelineTab === 'deliverables' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                Каждый участник цеха обязан своевременно предоставить следующие материалы в личном кабинете для согласования с кураторами Кинолаборатории:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activeRoleDef.deliverables && activeRoleDef.deliverables.length > 0 ? (
                  activeRoleDef.deliverables.map((del, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-white text-sm">
                            {del.name}
                          </h5>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                            {del.format}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>Срок сдачи: <b className="text-zinc-200">{del.deadlineDescription}</b></span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Согласование с куратором</span>
                        <span className="text-blue-400 font-medium">Обязательно</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-500 col-span-2">
                    Сдаваемые материалы не определены для данной роли.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Shift Checklist */}
          {guidelineTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Интерактивный экспресс-чеклист перед командой «Мотор!». Отмечайте пункты перед выходом на площадку:
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Готово: {Object.values(checkedChecklist).filter(Boolean).length} из {activeRoleDef.shiftChecklist?.length || 0}
                </span>
              </div>

              <div className="space-y-2 max-w-3xl">
                {activeRoleDef.shiftChecklist && activeRoleDef.shiftChecklist.length > 0 ? (
                  activeRoleDef.shiftChecklist.map((item, idx) => {
                    const isChecked = !!checkedChecklist[item];

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleChecklistItem(item)}
                        className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-colors text-xs ${
                          isChecked
                            ? 'bg-zinc-950/80 border-emerald-800/80 text-zinc-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-zinc-600 bg-zinc-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className={isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                          {item}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    Чек-лист формируется.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit / Add Book Modal for Cabinet Bookshelf */}
      {isCabinetBookModalOpen && (
        <EditBookModal
          isOpen={isCabinetBookModalOpen}
          onClose={() => {
            setIsCabinetBookModalOpen(false);
            setEditingCabinetBook(null);
            setEditingCabinetBookIndex(null);
          }}
          roleType={viewedRoleType}
          book={editingCabinetBook}
          bookIndex={editingCabinetBookIndex}
          onSave={(bookData, idx) => {
            if (idx !== null && idx !== undefined) {
              updateBookInRole(viewedRoleType, idx, bookData);
            } else {
              addBookToRole(viewedRoleType, bookData);
            }
          }}
          onDelete={(idx) => {
            deleteBookFromRole(viewedRoleType, idx);
          }}
        />
      )}

      {/* Change PIN Modal */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Смена PIN-кода кабинета</h4>
                  <p className="text-xs text-zinc-400">Участник: {currentMember.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangePinOpen(false);
                  setChangePinError(null);
                  setNewPinValue('');
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Новый 4-значный PIN-код:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={newPinValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNewPinValue(val);
                      setChangePinError(null);
                    }}
                    placeholder="Например, 6831"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-center font-mono text-xl tracking-widest text-emerald-400 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setNewPinValue(generateRandomPin())}
                    className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
                    title="Сгенерировать случайный PIN"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Случайный</span>
                  </button>
                </div>
              </div>

              {changePinError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                  {changePinError}
                </div>
              )}

              {pinChangeSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PIN-код успешно изменен и сохранен! Запомните новый код: <strong>{newPinValue}</strong></span>
                </div>
              )}

              <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <div>• PIN-код защищает ваш личный профиль и настройки от случайных правок.</div>
                <div>• Вход по 1234 запрещен. Сохраните новый код, чтобы не потерять доступ.</div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePinOpen(false);
                    setChangePinError(null);
                    setNewPinValue('');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={pinChangeSuccess}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  Сохранить новый PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
