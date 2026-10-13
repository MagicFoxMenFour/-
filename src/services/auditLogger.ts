import { AuditLogEntry, AuditActionType, UserRole } from '../types';
import { INITIAL_AUDIT_LOGS } from '../data/initialData';
import { syncSaveAuditLog, syncClearAuditLogs } from './firestoreSync';

const AUDIT_STORAGE_KEY = 'cinelab_audit_logs_v1';

export function getAuditLogs(): AuditLogEntry[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return INITIAL_AUDIT_LOGS;
    }
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      } catch {
        // ignore quota/security errors
      }
      return INITIAL_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_AUDIT_LOGS;
    }
    return parsed
      .filter((item): item is AuditLogEntry => Boolean(item && typeof item === 'object'))
      .map((item, idx) => {
        let ts = new Date().toISOString();
        if (typeof item.timestamp === 'string') {
          ts = item.timestamp;
        } else if (typeof item.timestamp === 'object' && item.timestamp !== null) {
          const sec = (item.timestamp as any).seconds;
          if (typeof sec === 'number') {
            ts = new Date(sec * 1000).toISOString();
          }
        }

        let det = '';
        if (typeof item.details === 'string') {
          det = item.details;
        } else if (item.details) {
          try {
            det = JSON.stringify(item.details);
          } catch {
            det = String(item.details);
          }
        }

        return {
          id: typeof item.id === 'string' ? item.id : `aud-${idx}-${Date.now()}`,
          timestamp: ts,
          actorName: typeof item.actorName === 'string' ? item.actorName : String(item.actorName || 'Администратор'),
          actorRole: item.actorRole === 'participant' ? ('participant' as const) : ('admin' as const),
          actionType: (item.actionType as AuditActionType) || 'group_change',
          targetTitle: typeof item.targetTitle === 'string' ? item.targetTitle : String(item.targetTitle || 'Объект системы'),
          details: det,
          groupId: typeof item.groupId === 'string' ? item.groupId : null,
        };
      });
  } catch (e) {
    console.error('Failed to parse audit logs from storage:', e);
    return INITIAL_AUDIT_LOGS;
  }
}

export function setLocalAuditLogs(logs: AuditLogEntry[]): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 300)));
    }
  } catch (e) {
    console.error('Failed to cache remote audit logs locally:', e);
  }
}

export function logAuditAction(params: {
  actorName: string;
  actorRole: UserRole;
  actionType: AuditActionType;
  targetTitle: string;
  details: string;
  groupId?: string | null;
}): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorName: String(params.actorName || 'Пользователь'),
    actorRole: params.actorRole === 'participant' ? 'participant' : 'admin',
    actionType: params.actionType,
    targetTitle: String(params.targetTitle || 'Объект'),
    details: String(params.details || ''),
    groupId: params.groupId || null,
  };

  try {
    const current = getAuditLogs();
    const updated = [newEntry, ...current.filter((c) => c.id !== newEntry.id)].slice(0, 300); // keep last 300 actions
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save audit log locally:', e);
  }

  // Cloud Firestore synchronization so ALL users & devices see updates in real-time
  syncSaveAuditLog(newEntry).catch((e) => {
    console.warn('Failed to sync audit log to Cloud Firestore:', e);
  });

  return newEntry;
}

export function clearAuditLogs(): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear audit logs locally:', e);
  }
  syncClearAuditLogs().catch((e) => {
    console.warn('Failed to clear audit logs in Firestore:', e);
  });
}

export function exportAuditLogsAsText(): string {
  const logs = getAuditLogs();
  if (!Array.isArray(logs) || logs.length === 0) {
    return 'Журнал аудита лаборатории пуст.';
  }
  return logs
    .filter(Boolean)
    .map((l) => {
      let dt = '—';
      try {
        dt = new Date(l.timestamp).toLocaleString('ru-RU');
      } catch {
        dt = String(l.timestamp || '—');
      }
      const role = String(l.actorRole || 'user').toUpperCase();
      const name = String(l.actorName || 'Пользователь');
      const action = String(l.actionType || 'action');
      const title = String(l.targetTitle || 'Объект');
      const details = String(l.details || '');
      return `[${dt}] [${role}] ${name}: (${action}) ${title} — ${details}`;
    })
    .join('\n');
}
