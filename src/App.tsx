/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Film,
  RefreshCw,
  Sparkles,
  BookOpen,
  KeyRound,
} from 'lucide-react';

import {
  FilmGroup,
  Participant,
  ProductionStage,
  RoleType,
  Task,
  TaskStatus,
  MediaAsset,
  AuditLogEntry,
  UserRole,
} from './types';
import {
  INITIAL_GROUPS,
  INITIAL_PARTICIPANTS,
  INITIAL_TASKS,
  INITIAL_MEDIA_ASSETS,
  INITIAL_AUDIT_LOGS,
} from './data/initialData';
import { detectConflicts } from './services/conflictDetector';
import { exportFilmLabToExcel } from './services/excelExport';
import { runAutoBalance } from './services/balancer';
import { googleSignIn, initAuth, logout } from './services/auth';
import {
  subscribeToCinelabData,
  seedCloudDatabaseIfEmpty,
  saveEntireStateToCloud,
  syncSaveGroup,
  syncDeleteGroup,
  syncSaveParticipant,
  syncDeleteParticipant,
  syncSaveTask,
  syncDeleteTask,
  syncResetDatabase,
  testFirestoreConnection,
  subscribeToAuditLogs,
  seedAuditLogsIfEmpty,
} from './services/firestoreSync';
import { getAuditLogs, logAuditAction, clearAuditLogs, setLocalAuditLogs } from './services/auditLogger';

import { Header } from './components/Header';
import { ConflictAlertBanner } from './components/ConflictAlertBanner';
import { GroupBoard } from './components/GroupBoard';
import { MemberCabinet } from './components/MemberCabinet';
import { RoleGuidelinesView } from './components/RoleGuidelinesView';
import { ParticipantPinsView } from './components/ParticipantPinsView';
import { ConflictModal } from './components/ConflictModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { AddGroupModal } from './components/AddGroupModal';
import { AddParticipantModal, generateUniqueParticipantId } from './components/AddParticipantModal';
import { EditGroupModal } from './components/EditGroupModal';
import { EditParticipantModal } from './components/EditParticipantModal';
import { VkDispatchModal } from './components/VkDispatchModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { AuditLogModal } from './components/AuditLogModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import {
  isCuratorUnlocked,
  isUserAdminEmail,
  setCuratorUnlocked,
  getParticipantPin,
  setParticipantPin,
  generateRandomPin,
} from './services/accessControl';
import { ROLES } from './data/roles';

export default function App() {
  // Main data state
  const [groups, setGroups] = useState<FilmGroup[]>(() => {
    const saved = localStorage.getItem('cinelab_groups_v5') || localStorage.getItem('cinelab_groups_v4');
    if (saved) {
      try {
        const parsed: FilmGroup[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return INITIAL_GROUPS;
      }
    }
    return INITIAL_GROUPS;
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('cinelab_participants_v4');
    const raw: Participant[] = saved ? JSON.parse(saved) : INITIAL_PARTICIPANTS;
    return raw.map((p) => {
      const pin = getParticipantPin(p.id, p.pinCode);
      const hasLegacyMockSkills = (p.skills || []).some(
        (s) =>
          s.includes('экспликация') ||
          s.includes('актёрами') ||
          s.includes('актерами') ||
          s.includes('Мизансцена') ||
          s.includes('Поэпизодник') ||
          s.includes('Драматургия') ||
          s.includes('ARRI') ||
          s.includes('FX6')
      );
      return {
        ...p,
        skills: hasLegacyMockSkills ? [] : (p.skills || []),
        pinCode: pin,
        preferredWithIds: p.preferredWithIds || [],
        avoidedWithIds: p.avoidedWithIds || [],
      };
    });
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('cinelab_tasks_v5') || localStorage.getItem('cinelab_tasks_v4');
    if (saved) {
      try {
        const parsed: Task[] = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          (parsed.length > 7 || parsed.some((t) => t.id === 'tsk-101' || t.title.includes('Режиссёрская экспликация')))
        ) {
          localStorage.setItem('cinelab_tasks_v5', JSON.stringify(INITIAL_TASKS));
          return INITIAL_TASKS;
        }
        return parsed;
      } catch {
        return INITIAL_TASKS;
      }
    }
    return INITIAL_TASKS;
  });

  // User Role & Permissions state (Admin vs Participant)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('cinelab_user_role');
    const unlocked = isCuratorUnlocked();
    if (saved === 'admin' && unlocked) {
      return 'admin';
    }
    if (saved === 'participant') {
      return 'participant';
    }
    return unlocked ? 'admin' : 'participant';
  });

  // Media Library Materials state
  const [materials, setMaterials] = useState<MediaAsset[]>(() => {
    const saved = localStorage.getItem('cinelab_materials_v1');
    return saved ? JSON.parse(saved) : INITIAL_MEDIA_ASSETS;
  });

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());

  // UI state
  const [currentView, setCurrentView] = useState<'moderator' | 'member' | 'guidelines'>('moderator');
  const [moderatorTab, setModeratorTab] = useState<'teams' | 'guidelines' | 'pins'>('teams');
  const [activeGuidelineRole, setActiveGuidelineRole] = useState<RoleType>('director');
  const [selectedMember, setSelectedMember] = useState<Participant>(() => INITIAL_PARTICIPANTS[0]);

  // Edit states
  const [editingGroup, setEditingGroup] = useState<FilmGroup | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dispatchingGroup, setDispatchingGroup] = useState<FilmGroup | null>(null);
  const [dispatchInitialTab, setDispatchInitialTab] = useState<
    'call_sheet' | 'announcement' | 'chat_setup'
  >('call_sheet');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Modals state
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [addParticipantInitialRole, setAddParticipantInitialRole] = useState<RoleType>('director');
  const [addParticipantInitialGroupId, setAddParticipantInitialGroupId] = useState<string>('bench');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isDeviceSyncOpen, setIsDeviceSyncOpen] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Auth state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Check Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Real-time synchronization across devices via Firestore
  useEffect(() => {
    // Seed initial data if remote is empty
    seedCloudDatabaseIfEmpty(INITIAL_GROUPS, INITIAL_PARTICIPANTS, INITIAL_TASKS);

    const unsubscribe = subscribeToCinelabData(
      ({ groups: remoteGroups, participants: remoteParticipants, tasks: remoteTasks, hasRemoteData }) => {
        if (hasRemoteData) {
          if (remoteGroups) {
            const sortedGroups = [...remoteGroups].sort((a, b) => (a.number || 0) - (b.number || 0));
            setGroups(sortedGroups);
            localStorage.setItem('cinelab_groups_v5', JSON.stringify(sortedGroups));
            localStorage.setItem('cinelab_groups_v4', JSON.stringify(sortedGroups));
          }
          if (remoteParticipants && remoteParticipants.length > 0) {
            const normalized = remoteParticipants.map((p, idx) => {
              const pin = getParticipantPin(p.id, p.pinCode);
              return {
                ...p,
                pinCode: pin,
                preferredWithIds: p.preferredWithIds || [],
                avoidedWithIds: p.avoidedWithIds || [],
              };
            });
            setParticipants(normalized);
            localStorage.setItem('cinelab_participants_v4', JSON.stringify(normalized));
            setSelectedMember((current) => {
              const matched = normalized.find((p) => p.id === current?.id);
              return matched || current;
            });
          }
          if (remoteTasks) {
            const hasOldTasks =
              remoteTasks.length > 7 ||
              remoteTasks.some(
                (t) => t.id === 'tsk-101' || t.title.includes('Режиссёрская экспликация')
              );
            if (hasOldTasks) {
              setTasks(INITIAL_TASKS);
              localStorage.setItem('cinelab_tasks_v5', JSON.stringify(INITIAL_TASKS));
            } else {
              setTasks(remoteTasks);
              localStorage.setItem('cinelab_tasks_v5', JSON.stringify(remoteTasks));
            }
          }
          setIsCloudSynced(true);
        }
      },
      (err) => {
        console.warn('Real-time sync error (falling back to local cache):', err);
      }
    );

    const unsubAuditLogs = subscribeToAuditLogs(
      (remoteLogs) => {
        if (remoteLogs && remoteLogs.length > 0) {
          setAuditLogs(remoteLogs);
          setLocalAuditLogs(remoteLogs);
        } else {
          // If cloud audit log collection is empty, seed with initial logs
          seedAuditLogsIfEmpty(INITIAL_AUDIT_LOGS);
        }
      },
      (err) => {
        console.warn('Audit logs real-time sync warning:', err);
      }
    );

    return () => {
      unsubscribe();
      unsubAuditLogs();
    };
  }, []);

  // Check URL query parameters for direct member portal links (?member=P01 or ?member=ivan)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const memberParam = params.get('member');
    if (memberParam) {
      const found = participants.find(
        (p) =>
          p.id.toLowerCase() === memberParam.toLowerCase() ||
          p.name.toLowerCase().includes(memberParam.toLowerCase()) ||
          p.vkId.toLowerCase() === memberParam.toLowerCase()
      );
      if (found) {
        setSelectedMember(found);
        setCurrentView('member');
        showToast(`Добро пожаловать в личный кабинет, ${found.name}!`);
      }
    }
  }, [participants]);

  // Sync state to localStorage backup
  useEffect(() => {
    localStorage.setItem('cinelab_groups_v5', JSON.stringify(groups));
    localStorage.setItem('cinelab_groups_v4', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('cinelab_participants_v4', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('cinelab_tasks_v5', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('cinelab_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('cinelab_materials_v1', JSON.stringify(materials));
  }, [materials]);

  // Real-time conflict detection
  const conflicts = useMemo(
    () => detectConflicts(participants, groups),
    [participants, groups]
  );

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        if (isUserAdminEmail(res.user.email)) {
          setCuratorUnlocked(true);
          setUserRole('admin');
          localStorage.setItem('cinelab_user_role', 'admin');
          showToast(`Куратор авторизован (${res.user.email}). Доступ к администрированию открыт.`);
        } else {
          showToast(`Вход выполнен: ${res.user.displayName || res.user.email}`);
        }
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      showToast(err?.message || 'Не удалось выполнить вход через Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setGoogleUser(null);
    showToast('Вы вышли из Google аккаунта');
  };

  // Role switcher handler
  const handleRoleChange = (role: UserRole, participant?: Participant) => {
    setUserRole(role);
    localStorage.setItem('cinelab_user_role', role);
    const target = participant || selectedMember;
    if (role === 'participant') {
      if (participant) {
        setSelectedMember(participant);
      }
      setCurrentView('member');
      showToast(`Режим участника: ${target.name}.`);
    } else {
      setCurrentView('moderator');
      showToast('Активирован режим Администратора (Куратора). Полный доступ.');
    }

    logAuditAction({
      actorName: role === 'admin' ? 'Главный продюсер (Куратор)' : target.name,
      actorRole: role,
      actionType: 'account_login',
      targetTitle: role === 'admin' ? 'Панель управления куратора' : target.name,
      details:
        role === 'admin'
          ? 'Активирован режим Администратора лаборатории'
          : `Выбран профиль участника (Табельный №: ${target.id})`,
      groupId: role === 'participant' ? target.groupId : null,
    });
  };

  // Media Library handlers
  const handleAddMaterial = (asset: MediaAsset) => {
    setMaterials((prev) => [asset, ...prev]);
    const targetGroup = groups.find((g) => g.id === asset.groupId);
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер' : selectedMember.name,
      actorRole: userRole,
      actionType: 'media_change',
      targetTitle: asset.title,
      details: `Загружен материал (${asset.type}): ${targetGroup ? targetGroup.name : 'Общие материалы'}. Версия ${asset.version || 'v1.0'}.`,
      groupId: asset.groupId,
    });
    setAuditLogs(getAuditLogs());
    showToast(`Материал «${asset.title}» добавлен в медиатеку`);
  };

  const handleDeleteMaterial = (assetId: string) => {
    const item = materials.find((m) => m.id === assetId);
    setMaterials((prev) => prev.filter((m) => m.id !== assetId));
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер' : selectedMember.name,
      actorRole: userRole,
      actionType: 'media_change',
      targetTitle: item?.title || 'Материал',
      details: 'Удален документ из медиатеки.',
      groupId: item?.groupId,
    });
    setAuditLogs(getAuditLogs());
    showToast('Материал удален из медиатеки');
  };

  const handleClearAuditLogs = () => {
    clearAuditLogs();
    setAuditLogs([]);
    showToast('Журнал аудита действий очищен');
  };

  // Move participant
  const handleMoveParticipant = (participantId: string, rawNewGroupId: string | null) => {
    const newGroupId = (!rawNewGroupId || rawNewGroupId === 'bench') ? null : rawNewGroupId;
    const existing = participants.find((item) => item.id === participantId);
    if (!existing) return;

    const updatedParticipant: Participant = { ...existing, groupId: newGroupId };

    setParticipants((prev) => {
      const next = prev.map((p) => (p.id === participantId ? updatedParticipant : p));
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
      return next;
    });
    if (selectedMember?.id === participantId) {
      setSelectedMember(updatedParticipant);
    }

    // Persist immediately to cloud Firestore
    syncSaveParticipant(updatedParticipant);

    const targetGroup = groups.find((g) => g.id === newGroupId);
    
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'member_move',
      targetTitle: existing.name || 'Участник',
      details: targetGroup ? `Назначен(а) в группу «${targetGroup.name}»` : 'Переведен(а) в резерв лаборатории (скамейка)',
      groupId: newGroupId,
    });
    setAuditLogs(getAuditLogs());

    showToast(
      `${existing.name || 'Участник'} перемещен(а) в ${
        targetGroup ? targetGroup.name : 'резерв'
      }`
    );
  };

  // Change role
  const handleChangeRole = (participantId: string, newRole: RoleType) => {
    const existing = participants.find((item) => item.id === participantId);
    if (!existing) return;

    const updatedParticipant: Participant = { ...existing, role: newRole };

    setParticipants((prev) => {
      const next = prev.map((p) => (p.id === participantId ? updatedParticipant : p));
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
      return next;
    });
    if (selectedMember?.id === participantId) {
      setSelectedMember(updatedParticipant);
    }

    // Persist immediately to cloud Firestore
    syncSaveParticipant(updatedParticipant);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'role_change',
      targetTitle: existing.name || 'Участник',
      details: `Смена амплуа / роли на «${ROLES[newRole]?.shortTitle || newRole}»`,
    });
    setAuditLogs(getAuditLogs());
    showToast(`Роль участника ${existing.name} обновлена на «${ROLES[newRole]?.shortTitle || newRole}»`);
  };

  // Edit Group handler
  const handleSaveGroup = (updatedGroup: FilmGroup) => {
    setGroups((prev) => {
      const nextGroups = prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
      localStorage.setItem('cinelab_groups_v5', JSON.stringify(nextGroups));
      localStorage.setItem('cinelab_groups_v4', JSON.stringify(nextGroups));
      return nextGroups;
    });
    syncSaveGroup(updatedGroup);
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'group_change',
      targetTitle: updatedGroup.name,
      details: `Обновлены данные группы: проект «${updatedGroup.projectTitle || updatedGroup.name}», стадия «${updatedGroup.stage}»`,
      groupId: updatedGroup.id,
    });
    showToast(`Группа «${updatedGroup.name}» успешно обновлена`);
  };

  // Delete Group handler
  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    const updatedParticipantsList = participants.map((p) =>
      p.groupId === groupId ? { ...p, groupId: null } : p
    );
    setParticipants(updatedParticipantsList);
    try {
      localStorage.setItem('cinelab_participants_v4', JSON.stringify(updatedParticipantsList));
    } catch {}

    setGroups((prev) => {
      const nextGroups = prev.filter((g) => g.id !== groupId);
      localStorage.setItem('cinelab_groups_v5', JSON.stringify(nextGroups));
      localStorage.setItem('cinelab_groups_v4', JSON.stringify(nextGroups));
      return nextGroups;
    });

    syncDeleteGroup(groupId);
    participants
      .filter((p) => p.groupId === groupId)
      .forEach((p) => syncSaveParticipant({ ...p, groupId: null }));

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'group_change',
      targetTitle: group?.name || 'Съёмочная группа',
      details: 'Группа расформирована куратором. Участники переведены в резерв лаборатории',
      groupId: groupId,
    });

    showToast(`Группа «${group?.name}» расформирована. Участники переведены в резерв.`);
  };

  // Edit Participant handler
  const handleSaveParticipant = (updatedParticipant: Participant) => {
    setParticipants((prev) => {
      const next = prev.map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p));
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
      return next;
    });
    if (selectedMember?.id === updatedParticipant.id) {
      setSelectedMember(updatedParticipant);
    }
    syncSaveParticipant(updatedParticipant);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'profile_update',
      targetTitle: updatedParticipant.name,
      details: `Куратор сохранил профиль участника: роль «${ROLES[updatedParticipant.role]?.shortTitle || updatedParticipant.role}», группа «${
        groups.find((g) => g.id === updatedParticipant.groupId)?.name || 'Резерв'
      }»`,
      groupId: updatedParticipant.groupId,
    });
    showToast(`Данные участника ${updatedParticipant.name} сохранены`);
  };

  // Delete Participant handler
  const handleDeleteParticipant = (participantId: string) => {
    const p = participants.find((item) => item.id === participantId);
    setParticipants((prev) => {
      const next = prev.filter((p) => p.id !== participantId);
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
    setTasks((prev) => prev.filter((t) => t.assignedToId !== participantId));
    syncDeleteParticipant(participantId);
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'member_move',
      targetTitle: p?.name || 'Участник',
      details: 'Участник удален из базы лаборатории',
      groupId: p?.groupId,
    });
    showToast('Участник удален из лаборатории');
  };

  // Update participant PIN code handler
  const handleUpdateParticipantPin = (participantId: string, newPin: string) => {
    const cleanPin = newPin.trim();
    setParticipantPin(participantId, cleanPin);
    const existing = participants.find((item) => item.id === participantId);
    if (!existing) return;

    const updated: Participant = { ...existing, pinCode: cleanPin };
    setParticipants((prev) => {
      const next = prev.map((p) => (p.id === participantId ? updated : p));
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
      return next;
    });
    if (selectedMember?.id === participantId) {
      setSelectedMember(updated);
    }
    syncSaveParticipant(updated);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'profile_update',
      targetTitle: updated.name,
      details:
        userRole === 'admin'
          ? `Куратор обновил PIN-код доступа (${cleanPin})`
          : 'Участник сменил персональный PIN-код кабинета',
      groupId: updated.groupId,
    });
    showToast(`PIN-код для ${updated.name} обновлен (${cleanPin})`);
  };

  // Edit Task handler
  const handleSaveTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    syncSaveTask(updatedTask);
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'task_change',
      targetTitle: updatedTask.title,
      details: `Статус задачи изменен на «${updatedTask.status}» (этап: ${updatedTask.stage})`,
      groupId: updatedTask.groupId,
    });
    showToast(`Задача «${updatedTask.title}» обновлена`);
  };

  // Delete Task handler
  const handleDeleteTask = (taskId: string) => {
    const t = tasks.find((item) => item.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    syncDeleteTask(taskId);
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'task_change',
      targetTitle: t?.title || 'Задача',
      details: 'Задача удалена из производственного плана',
      groupId: t?.groupId,
    });
    showToast('Задача удалена');
  };

  // VK update
  const handleUpdateMemberVk = (participantId: string, vkId: string, vkUrl: string) => {
    const existing = participants.find((item) => item.id === participantId);
    if (!existing) return;

    const updated: Participant = { ...existing, vkId, vkUrl };
    setParticipants((prev) => {
      const next = prev.map((p) => (p.id === participantId ? updated : p));
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
      return next;
    });
    if (selectedMember?.id === participantId) {
      setSelectedMember(updated);
    }

    syncSaveParticipant(updated);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'profile_update',
      targetTitle: updated.name,
      details: `Обновлен VK профиль: id «${vkId}» (${vkUrl || 'ссылка'})`,
      groupId: updated.groupId,
    });
    showToast('VK профиль обновлен');
  };

  // Partner preferences, stop-list & desired roles update
  const handleUpdateMemberPreferences = (
    participantId: string,
    preferredWithIds: string[],
    avoidedWithIds: string[] = [],
    desiredRoles?: RoleType[]
  ) => {
    const existing = participants.find((item) => item.id === participantId);
    if (!existing) return;

    const updated: Participant = {
      ...existing,
      preferredWithIds,
      avoidedWithIds,
      ...(desiredRoles !== undefined ? { desiredRoles } : {}),
    };

    setParticipants((prev) => {
      const next = prev.map((p) => (p.id === participantId ? updated : p));
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
      return next;
    });
    if (selectedMember?.id === participantId) {
      setSelectedMember(updated);
    }

    syncSaveParticipant(updated);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'stop_list_change',
      targetTitle: updated.name,
      details: `Обновлены предпочтения команды: Желаемые коллеги (${preferredWithIds.length}), Стоп-лист (${avoidedWithIds.length})`,
      groupId: updated.groupId,
    });
    showToast('Предпочтения обновлены и сохранены в облаке');
  };

  // Participant skills update handler (accessible by both participant and admin)
  const handleUpdateParticipantSkills = (participantId: string, skills: string[]) => {
    const existing = participants.find((item) => item.id === participantId);
    if (!existing) return;

    const updated: Participant = { ...existing, skills };
    setParticipants((prev) => {
      const next = prev.map((p) => (p.id === participantId ? updated : p));
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
      return next;
    });
    if (selectedMember?.id === participantId) {
      setSelectedMember(updated);
    }

    syncSaveParticipant(updated);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'profile_update',
      targetTitle: updated.name,
      details:
        skills.length > 0
          ? `Обновлены особые умения (${skills.length}): ${skills.join(', ')}`
          : 'Особые умения очищены',
      groupId: updated.groupId,
    });
    showToast(`Особые умения сохранены (${skills.length})`);
  };

  // Clear all stop-lists across all participants in the laboratory
  const handleClearAllStopLists = () => {
    const updated = participants.map((p) => ({
      ...p,
      avoidedWithIds: [],
    }));
    setParticipants(updated);
    if (selectedMember) {
      setSelectedMember({
        ...selectedMember,
        avoidedWithIds: [],
      });
    }
    localStorage.setItem('cinelab_participants_v4', JSON.stringify(updated));
    updated.forEach((p) => syncSaveParticipant(p));
    logAuditAction({
      actorName: 'Главный продюсер (Куратор)',
      actorRole: 'admin',
      actionType: 'stop_list_change',
      targetTitle: 'Все участники',
      details: 'Полная очистка всех стоп-листов в кинолаборатории',
    });
    showToast('Все стоп-листы успешно очищены у всех участников');
  };

  // Remove avoid restriction between two participants (mutual or single)
  const handleRemoveAvoidLink = (p1Id: string, p2Id: string) => {
    const p1 = participants.find((p) => p.id === p1Id);
    const p2 = participants.find((p) => p.id === p2Id);

    const u1: Participant | undefined = p1
      ? { ...p1, avoidedWithIds: (p1.avoidedWithIds || []).filter((id) => id !== p2Id) }
      : undefined;
    const u2: Participant | undefined = p2
      ? { ...p2, avoidedWithIds: (p2.avoidedWithIds || []).filter((id) => id !== p1Id) }
      : undefined;

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === p1Id && u1) return u1;
        if (p.id === p2Id && u2) return u2;
        return p;
      })
    );

    if (u1) syncSaveParticipant(u1);
    if (u2) syncSaveParticipant(u2);
    try {
      const updatedList = participants.map((p) => {
        if (p.id === p1Id && u1) return u1;
        if (p.id === p2Id && u2) return u2;
        return p;
      });
      localStorage.setItem('cinelab_participants_v4', JSON.stringify(updatedList));
    } catch {}

    if (selectedMember && (selectedMember.id === p1Id || selectedMember.id === p2Id)) {
      const active = (selectedMember.id === p1Id ? u1 : u2) || selectedMember;
      setSelectedMember(active);
    }
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'stop_list_change',
      targetTitle: `${p1?.name || p1Id} & ${p2?.name || p2Id}`,
      details: 'Снято взаимное ограничение стоп-листа',
    });
    showToast('Ограничение стоп-листа успешно снято');
  };

  // Task status update
  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;

    const updated: Task = { ...t, status };
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updated : task))
    );
    syncSaveTask(updated);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'task_change',
      targetTitle: t.title || 'Задача',
      details: `Статус задачи изменен на «${status}»`,
      groupId: t.groupId,
    });
  };

  // Task deliverable update
  const handleUpdateTaskDeliverable = (
    taskId: string,
    deliverableUrl: string,
    notes: string
  ) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;

    const updated: Task = {
      ...t,
      deliverableUrl,
      deliverableNotes: notes,
    };
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updated : task))
    );
    syncSaveTask(updated);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'task_change',
      targetTitle: t.title || 'Задача',
      details: `Прикреплен материал / ссылка на сдачу: ${deliverableUrl}`,
      groupId: t.groupId,
    });
    showToast('Материал успешно прикреплен');
  };

  const handleUpdateGroupStage = (groupId: string, stage: ProductionStage) => {
    const g = groups.find((item) => item.id === groupId);
    if (!g) return;

    const updated: FilmGroup = { ...g, stage };
    setGroups((prev) =>
      prev.map((group) => (group.id === groupId ? updated : group))
    );
    syncSaveGroup(updated);

    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'group_change',
      targetTitle: g.name || 'Съёмочная группа',
      details: `Стадия производства переведена на «${stage}»`,
      groupId,
    });
  };

  const handleAddGroup = (newGroup: FilmGroup) => {
    setGroups((prev) => {
      const nextGroups = [...prev, newGroup];
      localStorage.setItem('cinelab_groups_v5', JSON.stringify(nextGroups));
      localStorage.setItem('cinelab_groups_v4', JSON.stringify(nextGroups));
      return nextGroups;
    });
    syncSaveGroup(newGroup);
    logAuditAction({
      actorName: 'Главный продюсер (Куратор)',
      actorRole: 'admin',
      actionType: 'group_change',
      targetTitle: newGroup.name,
      details: `Создана группа: проект «${newGroup.projectTitle || newGroup.name}», стадия «${newGroup.stage}»`,
      groupId: newGroup.id,
    });
    showToast(`Группа «${newGroup.name}» создана`);
  };

  const handleAddParticipant = (newParticipant: Participant) => {
    // Safety guard against ID collision or overwriting existing participants
    let finalParticipant = newParticipant;
    if (participants.some((p) => p.id === newParticipant.id)) {
      const safeId = generateUniqueParticipantId(newParticipant.role, participants);
      finalParticipant = { ...newParticipant, id: safeId };
      setParticipantPin(safeId, finalParticipant.pinCode || generateRandomPin());
    }

    setParticipants((prev) => {
      const next = [
        ...prev.filter((p) => p.id !== finalParticipant.id),
        finalParticipant,
      ];
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
    syncSaveParticipant(finalParticipant);

    logAuditAction({
      actorName: 'Главный продюсер (Куратор)',
      actorRole: 'admin',
      actionType: 'member_move',
      targetTitle: finalParticipant.name,
      details: `В лабораторию добавлен новый участник: роль «${finalParticipant.role}», табельный №: ${finalParticipant.id}`,
      groupId: finalParticipant.groupId,
    });
    showToast(`Участник ${finalParticipant.name} (${finalParticipant.id}) успешно добавлен`);
  };

  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
    syncSaveTask(newTask);
    logAuditAction({
      actorName: userRole === 'admin' ? 'Главный продюсер (Куратор)' : selectedMember.name,
      actorRole: userRole,
      actionType: 'task_change',
      targetTitle: newTask.title,
      details: `Создана новая задача для группы ${newTask.groupId}: дедлайн ${newTask.deadline}`,
      groupId: newTask.groupId,
    });
    showToast(`Задача «${newTask.title}» добавлена`);
  };

  const handleExportExcel = () => {
    try {
      exportFilmLabToExcel(groups, participants, tasks, conflicts);
      showToast('Excel отчет скачан (.xlsx)');
    } catch (e: any) {
      console.error(e);
      showToast('Ошибка при формировании Excel файла');
    }
  };

  const handleAutoBalance = () => {
    const { updatedParticipants, changesSummary } = runAutoBalance(participants, groups);
    setParticipants(updatedParticipants);
    setIsConflictModalOpen(false);

    // Save all changed participants to cloud and localStorage so real-time sync doesn't revert them
    if (changesSummary.length > 0) {
      updatedParticipants.forEach((p) => syncSaveParticipant(p));
      try {
        localStorage.setItem('cinelab_participants_v4', JSON.stringify(updatedParticipants));
      } catch {}
    }

    logAuditAction({
      actorName: 'Главный продюсер (Куратор)',
      actorRole: 'admin',
      actionType: 'auto_balance',
      targetTitle: 'Съёмочные группы лаборатории',
      details:
        changesSummary.length > 0
          ? `Выполнена авто-балансировка: ${changesSummary.join('; ')}`
          : 'Проверка балансировки: составы оптимальны, конфликтов не обнаружено',
    });
    if (changesSummary.length > 0) {
      showToast(`Авто-балансировка: ${changesSummary.join('; ')}`);
    } else {
      showToast('Составы оптимальны');
    }
  };

  const handleResetData = () => {
    if (userRole !== 'admin') {
      showToast('Доступ запрещен. Только администратор может сбрасывать данные.');
      setIsResetModalOpen(false);
      return;
    }
    setGroups(INITIAL_GROUPS);
    setParticipants(INITIAL_PARTICIPANTS);
    setTasks(INITIAL_TASKS);
    localStorage.setItem('cinelab_groups_v5', JSON.stringify(INITIAL_GROUPS));
    localStorage.setItem('cinelab_groups_v4', JSON.stringify(INITIAL_GROUPS));
    localStorage.setItem('cinelab_participants_v4', JSON.stringify(INITIAL_PARTICIPANTS));
    localStorage.setItem('cinelab_tasks_v5', JSON.stringify(INITIAL_TASKS));
    syncResetDatabase(INITIAL_GROUPS, INITIAL_PARTICIPANTS, INITIAL_TASKS);
    logAuditAction({
      actorName: 'Главный продюсер (Куратор)',
      actorRole: 'admin',
      actionType: 'reset_data',
      targetTitle: 'База данных лаборатории',
      details: 'Сброс всех групп, участников и задач к эталонному состоянию 7 групп',
    });
    setIsResetModalOpen(false);
    showToast('Данные лаборатории успешно сброшены к исходным 7 группам');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view === 'guidelines') {
            setActiveGuidelineRole(userRole === 'participant' ? selectedMember.role : 'director');
          }
        }}
        selectedMember={selectedMember}
        onSelectMember={setSelectedMember}
        participants={participants}
        conflicts={conflicts}
        userRole={userRole}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onOpenConflicts={() => setIsConflictModalOpen(true)}
        onExportExcel={handleExportExcel}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenDeviceSync={() => setIsDeviceSyncOpen(true)}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        isLoggingIn={isLoggingIn}
        onAutoBalance={handleAutoBalance}
        onOpenParticipantPins={() => {
          setCurrentView('moderator');
          setModeratorTab('pins');
        }}
      />

      {/* Conflict Bar (Admin Only) */}
      {userRole === 'admin' && (
        <ConflictAlertBanner
          conflicts={conflicts}
          onOpenModal={() => setIsConflictModalOpen(true)}
          onAutoBalance={handleAutoBalance}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1800px] 2xl:max-w-[2100px] w-full mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6">
        {currentView === 'moderator' ? (
          <div className="space-y-5 sm:space-y-6">
            {/* View Sub-Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                <button
                  onClick={() => setModeratorTab('teams')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    moderatorTab === 'teams'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Съёмочные группы ({groups.length})</span>
                </button>

                <button
                  onClick={() => setModeratorTab('guidelines')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    moderatorTab === 'guidelines'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Памятки ролей (12 цехов)</span>
                </button>

                {userRole === 'admin' && (
                  <button
                    onClick={() => setModeratorTab('pins')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                      moderatorTab === 'pins'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-sm'
                        : 'text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900'
                    }`}
                    title="Реестр и восстановление 4-значных PIN-кодов всех участников"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>Коды доступа и PIN ({participants.length})</span>
                  </button>
                )}
              </div>

              {userRole === 'admin' && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setIsResetModalOpen(true)}
                    title="Восстановить исходные данные лаборатории (требуются права администратора)"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-300 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Сбросить к исходным</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sub-tab view */}
            {moderatorTab === 'teams' ? (
              <GroupBoard
                groups={groups}
                participants={participants}
                conflicts={conflicts}
                isAdmin={userRole === 'admin'}
                onMoveParticipant={handleMoveParticipant}
                onChangeRole={handleChangeRole}
                onOpenAddGroup={() => setIsAddGroupModalOpen(true)}
                onOpenAddParticipant={() => {
                  setAddParticipantInitialRole('director');
                  setAddParticipantInitialGroupId('bench');
                  setIsAddParticipantModalOpen(true);
                }}
                onOpenAddActor={() => {
                  setAddParticipantInitialRole('actor');
                  setAddParticipantInitialGroupId('bench');
                  setIsAddParticipantModalOpen(true);
                }}
                onEditGroup={(g) => setEditingGroup(g)}
                onEditParticipant={(p) => setEditingParticipant(p)}
                onDeleteGroup={handleDeleteGroup}
                onSelectMemberForCabinet={(m) => {
                  if (userRole === 'admin') {
                    setSelectedMember(m);
                    setCurrentView('member');
                  } else {
                    if (m.id === selectedMember.id) {
                      setCurrentView('member');
                    } else {
                      showToast(`Участник: ${m.name} (${ROLES[m.role]?.title || m.role}). Личный кабинет защищён PIN-кодом.`);
                    }
                  }
                }}
                onOpenVkDispatch={(g, initialTab) => {
                  if (userRole !== 'admin') return;
                  setDispatchingGroup(g);
                  if (initialTab) setDispatchInitialTab(initialTab);
                  else setDispatchInitialTab('call_sheet');
                }}
                onRemoveAvoidLink={handleRemoveAvoidLink}
              />
            ) : moderatorTab === 'guidelines' ? (
              <RoleGuidelinesView
                initialRoleType={activeGuidelineRole || (userRole === 'participant' ? selectedMember.role : 'director')}
                onBack={() => setModeratorTab('teams')}
                userRole={userRole}
              />
            ) : moderatorTab === 'pins' && userRole === 'admin' ? (
              <ParticipantPinsView
                participants={participants}
                groups={groups}
                onUpdateParticipantPin={handleUpdateParticipantPin}
                onSelectMemberForCabinet={(m) => {
                  setSelectedMember(m);
                  setCurrentView('member');
                }}
              />
            ) : null}
          </div>
        ) : currentView === 'guidelines' ? (
          <RoleGuidelinesView
            initialRoleType={activeGuidelineRole || (userRole === 'participant' ? selectedMember.role : 'director')}
            onBack={() => {
              if (userRole === 'admin') setCurrentView('moderator');
              else setCurrentView('member');
            }}
            userRole={userRole}
          />
        ) : (
          <MemberCabinet
            userRole={userRole}
            currentMember={
              participants.find((p) => p.id === selectedMember.id) || selectedMember
            }
            allParticipants={participants}
            groups={groups}
            onSelectMember={setSelectedMember}
            onEditParticipant={(p) => setEditingParticipant(p)}
            onUpdateMemberVk={handleUpdateMemberVk}
            onUpdateMemberPreferences={handleUpdateMemberPreferences}
            onRemoveAvoidLink={handleRemoveAvoidLink}
            onOpenRoleGuidelines={(role) => {
              setActiveGuidelineRole(role);
              setCurrentView('guidelines');
            }}
            onUpdateParticipantPin={handleUpdateParticipantPin}
            onUpdateParticipantSkills={handleUpdateParticipantSkills}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in text-xs font-medium">
          <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {userRole === 'admin' && isConflictModalOpen && (
        <ConflictModal
          isOpen={true}
          onClose={() => setIsConflictModalOpen(false)}
          conflicts={conflicts}
          groups={groups}
          participants={participants}
          onMoveParticipant={handleMoveParticipant}
          onChangeRole={handleChangeRole}
          onAutoBalance={handleAutoBalance}
          onRemoveAvoidLink={handleRemoveAvoidLink}
          onClearAllStopLists={handleClearAllStopLists}
        />
      )}

      {userRole === 'admin' && isWorkspaceModalOpen && (
        <WorkspaceModal
          isOpen={true}
          onClose={() => setIsWorkspaceModalOpen(false)}
          groups={groups}
          participants={participants}
          tasks={tasks}
          googleUser={googleUser}
          onGoogleSignIn={handleGoogleSignIn}
        />
      )}

      {isAddGroupModalOpen && (
        <AddGroupModal
          isOpen={true}
          onClose={() => setIsAddGroupModalOpen(false)}
          nextNumber={groups.length + 1}
          onAddGroup={handleAddGroup}
        />
      )}

      {isAddParticipantModalOpen && (
        <AddParticipantModal
          isOpen={true}
          onClose={() => setIsAddParticipantModalOpen(false)}
          groups={groups}
          allParticipants={participants}
          onAddParticipant={handleAddParticipant}
          initialRole={addParticipantInitialRole}
          initialGroupId={addParticipantInitialGroupId}
        />
      )}

      {/* Dedicated Edit Modals */}
      {editingGroup && (
        <EditGroupModal
          isOpen={true}
          onClose={() => setEditingGroup(null)}
          group={editingGroup}
          participants={participants}
          onSaveGroup={handleSaveGroup}
          onDeleteGroup={handleDeleteGroup}
          onMoveParticipant={handleMoveParticipant}
        />
      )}

      {editingParticipant && (
        <EditParticipantModal
          isOpen={true}
          onClose={() => setEditingParticipant(null)}
          participant={editingParticipant}
          groups={groups}
          allParticipants={participants}
          onSaveParticipant={handleSaveParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onRemoveInboundAvoid={handleRemoveAvoidLink}
        />
      )}

      {/* VK Dispatch & Chat Manager Modal (Admin Only) */}
      {userRole === 'admin' && dispatchingGroup && (
        <VkDispatchModal
          isOpen={true}
          onClose={() => setDispatchingGroup(null)}
          group={dispatchingGroup}
          participants={participants}
          initialTab={dispatchInitialTab}
          onSaveGroupChatUrl={(groupId, url) => {
            const existing = groups.find((g) => g.id === groupId);
            if (existing) {
              const updated = { ...existing, vkChatUrl: url };
              setGroups((prev) =>
                prev.map((g) => (g.id === groupId ? updated : g))
              );
              syncSaveGroup(updated);
            }
            showToast(`Ссылка на беседу «${dispatchingGroup.name}» сохранена`);
          }}
        />
      )}

      {/* Cross-Device Cloud Sync Modal (Admin Only) */}
      {userRole === 'admin' && (
        <DeviceSyncModal
          isOpen={isDeviceSyncOpen}
          onClose={() => setIsDeviceSyncOpen(false)}
          isCloudSynced={isCloudSynced}
          appUrl="https://ais-pre-ss3hwzlkhw3wsw6x5uczg5-492283559503.europe-west2.run.app"
          participants={participants}
        />
      )}

      {/* Role & Access Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentRole={userRole}
        selectedParticipant={selectedMember}
        participants={participants}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSelectRole={handleRoleChange}
      />

      {/* Admin Audit Log Modal */}
      {isAuditLogOpen && userRole === 'admin' && (
        <AuditLogModal
          isOpen={true}
          onClose={() => setIsAuditLogOpen(false)}
          logs={auditLogs}
          onClearLogs={handleClearAuditLogs}
        />
      )}

      {/* Admin Reset Confirmation Modal */}
      {userRole === 'admin' && (
        <ResetConfirmationModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={handleResetData}
          groupsCount={groups.length}
          participantsCount={participants.length}
        />
      )}
    </div>
  );
}
