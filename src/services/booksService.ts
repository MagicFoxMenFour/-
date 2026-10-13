// Service for managing role bookshelf recommendations
// Allows curators/admins to view, add, edit, and delete books per film department/role.
// Persists to localStorage and optionally syncs with Firestore.

import { ROLES } from '../data/roles';
import { RoleType, RoleBookRecommendation } from '../types';
import { db } from './firestoreSync';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BOOKS_STORAGE_KEY = 'cinelab_role_books_v2';
const listeners: Array<() => void> = [];

export function subscribeToRoleBooks(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (err) {
      console.error('Error notifying books listener:', err);
    }
  });
}

// Get initial defaults from ROLES
export function getDefaultBooksForRole(role: RoleType): RoleBookRecommendation[] {
  return ROLES[role]?.recommendedBooks ? [...ROLES[role].recommendedBooks] : [];
}

// Load all books from localStorage, fallback to defaults
export function getAllRoleBooks(): Record<RoleType, RoleBookRecommendation[]> {
  const result: Record<RoleType, RoleBookRecommendation[]> = {} as any;
  const roleKeys = Object.keys(ROLES) as RoleType[];

  let stored: Record<string, RoleBookRecommendation[]> = {};
  try {
    const raw = localStorage.getItem(BOOKS_STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse stored role books:', e);
  }

  for (const role of roleKeys) {
    if (stored[role] && Array.isArray(stored[role])) {
      result[role] = stored[role];
    } else {
      result[role] = getDefaultBooksForRole(role);
    }
  }

  return result;
}

// Get books for a specific role
export function getBooksForRole(role: RoleType): RoleBookRecommendation[] {
  const all = getAllRoleBooks();
  return all[role] || getDefaultBooksForRole(role);
}

// Save books for a specific role
export function saveBooksForRole(role: RoleType, books: RoleBookRecommendation[]): void {
  const all = getAllRoleBooks();
  all[role] = books;
  try {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save role books to localStorage:', e);
  }

  // Async sync to Firestore
  try {
    const docRef = doc(db, 'settings', 'role_books');
    setDoc(docRef, { [role]: books }, { merge: true }).catch((err) => {
      console.warn('Firestore books sync warning:', err);
    });
  } catch (err) {
    // Ignore offline errors
  }

  notifyListeners();
}

import { deleteBookFileFromDB } from './bookStorage';

// Add a book to a role
export function addBookToRole(role: RoleType, book: RoleBookRecommendation): void {
  const current = getBooksForRole(role);
  const bookWithId: RoleBookRecommendation = {
    ...book,
    id: book.id || `book_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  const updated = [...current, bookWithId];
  saveBooksForRole(role, updated);
}

// Update a book at index
export function updateBookInRole(
  role: RoleType,
  index: number,
  updatedBook: RoleBookRecommendation
): void {
  const current = getBooksForRole(role);
  if (index >= 0 && index < current.length) {
    const existing = current[index];
    const bookWithId: RoleBookRecommendation = {
      ...updatedBook,
      id: updatedBook.id || existing.id || `book_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    const updated = [...current];
    updated[index] = bookWithId;
    saveBooksForRole(role, updated);
  }
}

// Delete a book at index
export function deleteBookFromRole(role: RoleType, index: number): void {
  const current = getBooksForRole(role);
  if (index >= 0 && index < current.length) {
    const bookToDelete = current[index];
    if (bookToDelete.id) {
      deleteBookFileFromDB(bookToDelete.id).catch(() => {});
    }
    const updated = current.filter((_, idx) => idx !== index);
    saveBooksForRole(role, updated);
  }
}

// Reset books for a role back to defaults
export function resetBooksForRole(role: RoleType): void {
  const defaults = getDefaultBooksForRole(role);
  saveBooksForRole(role, defaults);
}

// Try loading remote books from Firestore on initialization
export async function syncBooksFromFirestore(): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'role_books');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const current = getAllRoleBooks();
      let changed = false;
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          current[key as RoleType] = val;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(current));
        notifyListeners();
      }
    }
  } catch (e) {
    // offline or not configured
  }
}
