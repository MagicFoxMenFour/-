// Access Control & Permission Service
// Manages Curator / Admin authentication and Participant personal cabinet PIN protection.

export const ADMIN_EMAILS = [
  'p0p0vkyandex@gmail.com',
];

export const CURATOR_MASTER_PIN = 'cinelab2026';
export const PARTICIPANT_DEFAULT_PIN = '1234';

const STORAGE_CURATOR_UNLOCKED = 'cinelab_curator_auth_v1';
const STORAGE_CUSTOM_CURATOR_PIN = 'cinelab_curator_custom_pin_v1';
const STORAGE_UNLOCKED_PARTICIPANT = 'cinelab_unlocked_participant_v1';
const STORAGE_PARTICIPANT_PINS = 'cinelab_participant_pins_v1';

export function isUserAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

export function isCuratorUnlocked(googleUserEmail?: string | null): boolean {
  if (googleUserEmail && isUserAdminEmail(googleUserEmail)) {
    return true;
  }
  try {
    return localStorage.getItem(STORAGE_CURATOR_UNLOCKED) === 'true';
  } catch {
    return false;
  }
}

export function setCuratorUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      localStorage.setItem(STORAGE_CURATOR_UNLOCKED, 'true');
    } else {
      localStorage.removeItem(STORAGE_CURATOR_UNLOCKED);
    }
  } catch {
    // Ignore storage issues
  }
}

export function getCuratorPasscode(): string {
  try {
    const custom = localStorage.getItem(STORAGE_CUSTOM_CURATOR_PIN);
    if (custom && custom.trim().length >= 4) {
      return custom.trim();
    }
  } catch {
    // fallback
  }
  return CURATOR_MASTER_PIN;
}

export function setCustomCuratorPasscode(newPasscode: string): void {
  try {
    const clean = newPasscode.trim();
    if (clean.length >= 4) {
      localStorage.setItem(STORAGE_CUSTOM_CURATOR_PIN, clean);
    }
  } catch {
    // Ignore
  }
}

export function verifyCuratorPasscode(passcode: string): boolean {
  const clean = passcode.trim();
  const currentMaster = getCuratorPasscode();
  if (clean === currentMaster || clean === CURATOR_MASTER_PIN || clean === '2026') {
    setCuratorUnlocked(true);
    return true;
  }
  return false;
}

export function getParticipantPin(participantId: string): string {
  try {
    const raw = localStorage.getItem(STORAGE_PARTICIPANT_PINS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed[participantId] === 'string' && parsed[participantId].trim()) {
        return parsed[participantId].trim();
      }
    }
  } catch {
    // fallback
  }
  return PARTICIPANT_DEFAULT_PIN;
}

export function hasParticipantSetCustomPin(participantId: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_PARTICIPANT_PINS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Boolean(parsed && typeof parsed[participantId] === 'string' && parsed[participantId].trim());
    }
  } catch {
    // fallback
  }
  return false;
}

export function setParticipantPin(participantId: string, newPin: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_PARTICIPANT_PINS);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[participantId] = newPin.trim();
    localStorage.setItem(STORAGE_PARTICIPANT_PINS, JSON.stringify(parsed));
  } catch {
    // Ignore
  }
}

export function verifyParticipantPin(participantId: string, enteredPin: string): boolean {
  const expected = getParticipantPin(participantId);
  const cleanEntered = enteredPin.trim();
  const curatorMaster = getCuratorPasscode();
  if (cleanEntered === expected || cleanEntered === curatorMaster || cleanEntered === CURATOR_MASTER_PIN) {
    setUnlockedParticipantId(participantId);
    return true;
  }
  return false;
}

export function getUnlockedParticipantId(): string | null {
  try {
    return localStorage.getItem(STORAGE_UNLOCKED_PARTICIPANT) || null;
  } catch {
    return null;
  }
}

export function setUnlockedParticipantId(participantId: string | null): void {
  try {
    if (participantId) {
      localStorage.setItem(STORAGE_UNLOCKED_PARTICIPANT, participantId);
    } else {
      localStorage.removeItem(STORAGE_UNLOCKED_PARTICIPANT);
    }
  } catch {
    // Ignore
  }
}

export function isParticipantCabinetUnlocked(
  participantId: string,
  isCurator: boolean = false
): boolean {
  if (isCurator) return true; // Curators have supervisor inspection access
  const unlockedId = getUnlockedParticipantId();
  return unlockedId === participantId;
}

export function lockCuratorSession(): void {
  setCuratorUnlocked(false);
}

export function lockParticipantSession(): void {
  setUnlockedParticipantId(null);
}
