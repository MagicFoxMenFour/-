import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FilmGroup, Participant, Task, AuditLogEntry } from '../types';

// Initialize or get Firebase App
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Initialize Firestore with ignoreUndefinedProperties: true
// This is critical: without this, any field with value undefined throws an error
// and breaks real-time synchronization, causing edits to roll back.
const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = (() => {
  try {
    return initializeFirestore(firebaseApp, {
      ignoreUndefinedProperties: true,
    }, dbId);
  } catch {
    return getFirestore(firebaseApp, dbId);
  }
})();

/**
 * Deeply sanitizes an object for Firestore by removing any undefined properties
 * and ensuring nested arrays and objects are clean and Firestore-safe.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean as any;
  }
  return data;
}

// Test connection on boot as required
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'cinelab', 'healthcheck'));
    return true;
  } catch (error: any) {
    // If not found, connection is still alive; only offline indicates issue
    if (error?.message?.includes('client is offline')) {
      console.warn('Firestore client is offline, using cache/fallback');
      return false;
    }
    return true;
  }
}

// Collection references
const GROUPS_COL = 'groups';
const PARTICIPANTS_COL = 'participants';
const TASKS_COL = 'tasks';
const AUDIT_LOGS_COL = 'audit_logs';

/**
 * Real-time synchronization listeners for groups, participants, tasks.
 * Changes made on computer or mobile update immediately across all devices!
 */
export function subscribeToCinelabData(
  onData: (payload: {
    groups: FilmGroup[];
    participants: Participant[];
    tasks: Task[];
    hasRemoteData: boolean;
  }) => void,
  onError?: (err: any) => void
) {
  let latestGroups: FilmGroup[] | null = null;
  let latestParticipants: Participant[] | null = null;
  let latestTasks: Task[] | null = null;

  const emitIfReady = () => {
    if (latestGroups && latestParticipants && latestTasks) {
      const hasRemoteData =
        latestGroups.length > 0 ||
        latestParticipants.length > 0 ||
        latestTasks.length > 0;
      onData({
        groups: latestGroups,
        participants: latestParticipants,
        tasks: latestTasks,
        hasRemoteData,
      });
    }
  };

  const unsubGroups = onSnapshot(
    collection(db, GROUPS_COL),
    (snap) => {
      latestGroups = snap.docs.map((d) => d.data() as FilmGroup);
      emitIfReady();
    },
    (err) => {
      console.error('Error fetching groups from firestore:', err);
      if (onError) onError(err);
    }
  );

  const unsubParticipants = onSnapshot(
    collection(db, PARTICIPANTS_COL),
    (snap) => {
      latestParticipants = snap.docs.map((d) => d.data() as Participant);
      emitIfReady();
    },
    (err) => {
      console.error('Error fetching participants from firestore:', err);
      if (onError) onError(err);
    }
  );

  const unsubTasks = onSnapshot(
    collection(db, TASKS_COL),
    (snap) => {
      latestTasks = snap.docs.map((d) => d.data() as Task);
      emitIfReady();
    },
    (err) => {
      console.error('Error fetching tasks from firestore:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubGroups();
    unsubParticipants();
    unsubTasks();
  };
}

/**
 * Initialize cloud database ONLY on brand new empty database.
 * Never restores or overrides groups if data already exists in the cloud,
 * allowing flexible 1, 5, 20 or any dynamic number of groups.
 */
export async function seedCloudDatabaseIfEmpty(
  initialGroups: FilmGroup[],
  initialParticipants: Participant[],
  initialTasks: Task[]
): Promise<boolean> {
  try {
    const snapGroups = await getDocs(collection(db, GROUPS_COL));
    const snapParticipants = await getDocs(collection(db, PARTICIPANTS_COL));
    if (snapGroups.empty && snapParticipants.empty) {
      await saveEntireStateToCloud(initialGroups, initialParticipants, initialTasks);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to check cloud database:', err);
    return false;
  }
}

/**
 * Atomically saves all groups, participants, and tasks in batches
 */
export async function saveEntireStateToCloud(
  groups: FilmGroup[],
  participants: Participant[],
  tasks: Task[]
): Promise<void> {
  const batch = writeBatch(db);

  groups.forEach((g) => {
    batch.set(doc(db, GROUPS_COL, g.id), sanitizeForFirestore(g));
  });

  participants.forEach((p) => {
    batch.set(doc(db, PARTICIPANTS_COL, p.id), sanitizeForFirestore({
      ...p,
      groupId: p.groupId !== undefined ? p.groupId : null,
      preferredWithIds: p.preferredWithIds || [],
      avoidedWithIds: p.avoidedWithIds || [],
      skills: p.skills || [],
    }));
  });

  tasks.forEach((t) => {
    batch.set(doc(db, TASKS_COL, t.id), sanitizeForFirestore(t));
  });

  await batch.commit();
}

/**
 * Granular sync helpers for real-time updates
 */
export async function syncSaveGroup(group: FilmGroup): Promise<void> {
  try {
    const clean = sanitizeForFirestore(group);
    await setDoc(doc(db, GROUPS_COL, group.id), clean);
  } catch (e) {
    console.error('syncSaveGroup error:', e);
  }
}

export async function syncDeleteGroup(groupId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, GROUPS_COL, groupId));
  } catch (e) {
    console.error('syncDeleteGroup error:', e);
  }
}

export async function syncSaveParticipant(participant: Participant): Promise<void> {
  try {
    const clean = sanitizeForFirestore({
      ...participant,
      groupId: participant.groupId !== undefined ? participant.groupId : null,
      preferredWithIds: participant.preferredWithIds || [],
      avoidedWithIds: participant.avoidedWithIds || [],
      skills: participant.skills || [],
    });
    await setDoc(doc(db, PARTICIPANTS_COL, participant.id), clean);
  } catch (e) {
    console.error('syncSaveParticipant error:', e);
  }
}

export async function syncDeleteParticipant(participantId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PARTICIPANTS_COL, participantId));
  } catch (e) {
    console.error('syncDeleteParticipant error:', e);
  }
}

export async function syncSaveTask(task: Task): Promise<void> {
  try {
    const clean = sanitizeForFirestore(task);
    await setDoc(doc(db, TASKS_COL, task.id), clean);
  } catch (e) {
    console.error('syncSaveTask error:', e);
  }
}

export async function syncDeleteTask(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TASKS_COL, taskId));
  } catch (e) {
    console.error('syncDeleteTask error:', e);
  }
}

export async function syncResetDatabase(
  groups: FilmGroup[],
  participants: Participant[],
  tasks: Task[]
): Promise<void> {
  const batch = writeBatch(db);

  // Clear existing
  const [gSnap, pSnap, tSnap] = await Promise.all([
    getDocs(collection(db, GROUPS_COL)),
    getDocs(collection(db, PARTICIPANTS_COL)),
    getDocs(collection(db, TASKS_COL)),
  ]);

  gSnap.docs.forEach((d) => batch.delete(d.ref));
  pSnap.docs.forEach((d) => batch.delete(d.ref));
  tSnap.docs.forEach((d) => batch.delete(d.ref));

  // Add fresh
  groups.forEach((g) => batch.set(doc(db, GROUPS_COL, g.id), sanitizeForFirestore(g)));
  participants.forEach((p) => batch.set(doc(db, PARTICIPANTS_COL, p.id), sanitizeForFirestore({
    ...p,
    groupId: p.groupId !== undefined ? p.groupId : null,
    preferredWithIds: p.preferredWithIds || [],
    avoidedWithIds: p.avoidedWithIds || [],
    skills: p.skills || [],
  })));
  tasks.forEach((t) => batch.set(doc(db, TASKS_COL, t.id), sanitizeForFirestore(t)));

  await batch.commit();
}

/**
 * Real-time synchronization for Audit Logs across all devices & users.
 */
export function subscribeToAuditLogs(
  onLogs: (logs: AuditLogEntry[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, AUDIT_LOGS_COL),
    (snap) => {
      const logs = snap.docs.map((d) => d.data() as AuditLogEntry);
      // Sort newest first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onLogs(logs);
    },
    (err) => {
      console.error('Error fetching audit logs from firestore:', err);
      if (onError) onError(err);
    }
  );
}

export async function syncSaveAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await setDoc(doc(db, AUDIT_LOGS_COL, entry.id), entry);
  } catch (e) {
    console.error('syncSaveAuditLog error:', e);
  }
}

export async function syncClearAuditLogs(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, AUDIT_LOGS_COL));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.error('syncClearAuditLogs error:', e);
  }
}

export async function seedAuditLogsIfEmpty(initialLogs: AuditLogEntry[]): Promise<void> {
  try {
    const snap = await getDocs(collection(db, AUDIT_LOGS_COL));
    if (snap.empty && initialLogs.length > 0) {
      const batch = writeBatch(db);
      initialLogs.slice(0, 30).forEach((log) => {
        batch.set(doc(db, AUDIT_LOGS_COL, log.id), log);
      });
      await batch.commit();
    }
  } catch (e) {
    console.error('seedAuditLogsIfEmpty error:', e);
  }
}

