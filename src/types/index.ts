export type RoleType =
  | 'director'
  | 'screenwriter'
  | 'dop'
  | 'camera_2'
  | 'editor'
  | 'production_designer'
  | 'producer'
  | 'sound_designer'
  | 'makeup_artist'
  | 'composer'
  | 'assistant'
  | 'actor';

export interface RoleStageDuties {
  stage: 'pre_production' | 'production' | 'post_production';
  stageTitle: string;
  duties: string[];
}

export interface RoleDeliverable {
  name: string;
  format: string;
  deadlineDescription: string;
}

export interface RoleBookRecommendation {
  title: string;
  author: string;
  whyRead: string;
}

export interface StudentProjectFocus {
  critical: string[]; // 🟢 Критически важно для студенческого проекта (Фокус)
  unimportant: string[]; // 🔴 Неважно / частые ошибки новичков (Не тратьте силы!)
  studentTips: string[]; // 💡 Практические советы для непрофессионалов
}

export interface RoleInfo {
  type: RoleType;
  title: string;
  shortTitle: string;
  iconName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  maxPerGroup: number;
  essential: boolean;
  description: string;
  responsibilities: string[];
  stageBreakdown?: RoleStageDuties[];
  deliverables?: RoleDeliverable[];
  shiftChecklist?: string[];
  collaboratesWith?: string[];
  studentFocus?: StudentProjectFocus;
  recommendedBooks?: RoleBookRecommendation[];
}

export interface Participant {
  id: string; // e.g. "CINE-01"
  name: string;
  avatar: string;
  vkId: string; // e.g. "kutsayeva_k"
  vkUrl: string; // https://vk.com/...
  role: RoleType; // Закреплённая роль (утверждается куратором)
  desiredRoles?: RoleType[]; // Желаемые роли участника (выбирает сам в личном кабинете)
  groupId: string | null; // null means bench / unassigned
  preferredWithIds: string[]; // participant IDs they prefer to work with
  avoidedWithIds?: string[]; // participant IDs they definitely DO NOT want to work with (стоп-лист / исключения)
  skills?: string[];
  notes?: string;
  pinCode?: string; // Личный PIN-код для защиты кабинета участника (по умолчанию 1234)
}

export type ProductionStage = 'development' | 'pre_production' | 'production' | 'post_production';

export interface FilmGroup {
  id: string;
  number: number;
  name: string;
  projectTitle: string;
  genre: string;
  logline: string;
  stage: ProductionStage;
  color: string;
  vkChatUrl?: string; // Link to group chat in VK (e.g. https://vk.me/join/...)
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  groupId: string;
  assignedToId: string; // participant ID
  role: RoleType;
  stage: ProductionStage;
  status: TaskStatus;
  deadline: string; // YYYY-MM-DD
  deliverableUrl?: string;
  deliverableNotes?: string;
}

export type ConflictType =
  | 'duplicate_role'
  | 'missing_role'
  | 'broken_preference'
  | 'avoided_partner_conflict'
  | 'overcapacity';

export interface ConflictItem {
  id: string;
  type: ConflictType;
  severity: 'error' | 'warning';
  groupId: string;
  groupName: string;
  participantId?: string;
  participantName?: string;
  relatedParticipantId?: string;
  relatedParticipantName?: string;
  role?: RoleType;
  message: string;
  detail: string;
  suggestedActionTitle: string;
  actionType: 'reassign_role' | 'move_group' | 'dismiss_preference' | 'fill_role' | 'separate_members';
}

export type UserRole = 'admin' | 'participant';

export interface AppUser {
  id: string;
  role: UserRole;
  name: string;
  participantId?: string; // set when role === 'participant'
}

export type MediaAssetType =
  | 'script'
  | 'storyboard'
  | 'kpp'
  | 'sound'
  | 'reference'
  | 'other';

export interface MediaAsset {
  id: string;
  title: string;
  description: string;
  type: MediaAssetType;
  groupId: string | null; // null = common/all groups
  fileUrl: string; // link to PDF, Drive, Figma, Image, etc.
  previewUrl?: string; // thumbnail for storyboards / moodboards
  uploadedBy: string; // name of producer or student
  createdAt: string; // ISO string
  version?: string; // e.g. "v1.0", "Draft 2"
  tags?: string[];
}

export type AuditActionType =
  | 'member_move'
  | 'role_change'
  | 'stop_list_change'
  | 'task_change'
  | 'group_change'
  | 'media_change'
  | 'auto_balance'
  | 'reset_data';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  actorName: string; // e.g. "Продюсер (Администратор)"
  actorRole: UserRole;
  actionType: AuditActionType;
  targetTitle: string; // e.g. "Ксения Куцаева" or "Сценарий (v2)"
  details: string; // Detailed description of what changed
  groupId?: string | null;
}
