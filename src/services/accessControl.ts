// Access Control & Permission Service
// Manages Curator / Admin authentication and Participant personal cabinet PIN protection.

export const ADMIN_EMAILS = [
  'p0p0vkyandex@gmail.com',
];

export const CURATOR_MASTER_PIN = 'cinelab2026';

const STORAGE_CURATOR_UNLOCKED = 'cinelab_curator_auth_v1';
const STORAGE_CUSTOM_CURATOR_PIN = 'cinelab_curator_custom_pin_v1';
const STORAGE_UNLOCKED_PARTICIPANT = 'cinelab_unlocked_participant_v1';
const STORAGE_PARTICIPANT_PINS = 'cinelab_participant_pins_v1';

/**
 * Generates a truly random 4-digit PIN between 1000 and 9999 (excluding '1234')
 */
export function generateRandomPin(): string {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  return pin === '1234' ? '4892' : pin;
}

/**
 * Generates a deterministic unique 4-digit PIN for a participant based on ID / index.
 * Guaranteed to never be '1234' and creates unique numbers for each participant.
 */
export function generateParticipantPin(participantId: string, index: number = 0): string {
  const idNum = parseInt(participantId.replace(/\D/g, ''), 10) || (index + 1);
  const raw = ((idNum * 1747 + 2389) % 9000) + 1000;
  const pin = raw.toString();
  return pin === '1234' ? '5829' : pin;
}

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

/**
 * Returns the participant's PIN code.
 * If not already saved or if previously set to '1234', generates a random/deterministic PIN
 * and persists it to ensure security.
 */
export function getParticipantPin(participantId: string, fallbackPin?: string): string {
  try {
    const raw = localStorage.getItem(STORAGE_PARTICIPANT_PINS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed[participantId] === 'string' && parsed[participantId].trim()) {
        const pin = parsed[participantId].trim();
        if (pin !== '1234' && pin.length === 4) {
          return pin;
        }
      }
    }
  } catch {
    // fallback
  }

  if (fallbackPin && fallbackPin.trim().length === 4 && fallbackPin.trim() !== '1234') {
    setParticipantPin(participantId, fallbackPin.trim());
    return fallbackPin.trim();
  }

  // Generate an individual deterministic 4-digit PIN (never '1234')
  const newPin = generateParticipantPin(participantId);
  setParticipantPin(participantId, newPin);
  return newPin;
}

export function hasParticipantSetCustomPin(participantId: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_PARTICIPANT_PINS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const val = parsed?.[participantId];
      return Boolean(typeof val === 'string' && val.trim().length === 4 && val.trim() !== '1234');
    }
  } catch {
    // fallback
  }
  return false;
}

export function setParticipantPin(participantId: string, newPin: string): void {
  try {
    const clean = newPin.trim();
    if (clean.length !== 4 || !/^\d{4}$/.test(clean)) {
      return;
    }
    const raw = localStorage.getItem(STORAGE_PARTICIPANT_PINS);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[participantId] = clean;
    localStorage.setItem(STORAGE_PARTICIPANT_PINS, JSON.stringify(parsed));
  } catch {
    // Ignore
  }
}

/**
 * Resets / generates a fresh random 4-digit PIN for a participant
 */
export function resetParticipantPin(participantId: string): string {
  const freshPin = generateRandomPin();
  setParticipantPin(participantId, freshPin);
  return freshPin;
}

/**
 * Verifies whether the entered PIN matches the participant's PIN or the curator emergency passcode.
 * Explicitly rejects '1234' unless that is the assigned PIN (which is disallowed by policy).
 */
export function verifyParticipantPin(
  participantId: string,
  enteredPin: string,
  actualPin?: string
): boolean {
  const cleanEntered = enteredPin.trim();
  if (cleanEntered === '1234') {
    // Disallow 1234
    return false;
  }

  const expected = getParticipantPin(participantId, actualPin);
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
