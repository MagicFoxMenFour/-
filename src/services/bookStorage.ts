// Service for storing and downloading book documents (PDF, EPUB, FB2, DOCX)
// Uses IndexedDB for reliable offline storage of large files (up to hundreds of MBs)
// and handles downloads directly in the browser.

import { RoleBookRecommendation } from '../types';

const DB_NAME = 'cinelab_books_files_db';
const DB_VERSION = 1;
const STORE_NAME = 'book_files';

function openBooksDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this browser'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 КБ';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

// Convert a File to base64 Data URL (used for embedded storage or fallback)
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Save a book file to IndexedDB
export async function saveBookFileToDB(
  bookId: string,
  file: File
): Promise<{ fileName: string; fileSize: string; fileType: string }> {
  const db = await openBooksDB();
  const fileRecord = {
    id: bookId,
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type || 'application/pdf',
    blob: file,
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(fileRecord);

    req.onsuccess = () => {
      resolve({
        fileName: fileRecord.name,
        fileSize: fileRecord.size,
        fileType: fileRecord.type,
      });
    };
    req.onerror = () => reject(req.error);
  });
}

// Get a book file from IndexedDB
export async function getBookFileFromDB(
  bookId: string
): Promise<{ blob: Blob; fileName: string } | null> {
  try {
    const db = await openBooksDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(bookId);

      req.onsuccess = () => {
        const result = req.result;
        if (result && result.blob) {
          resolve({ blob: result.blob, fileName: result.name });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB:', err);
    return null;
  }
}

// Delete a book file from IndexedDB
export async function deleteBookFileFromDB(bookId: string): Promise<void> {
  try {
    const db = await openBooksDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(bookId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }
}

// Trigger browser download for a book
export async function triggerBookDownload(book: RoleBookRecommendation): Promise<boolean> {
  const safeFilename =
    book.fileName ||
    `${book.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

  // 1. Direct Base64 data URL
  if (book.fileData && book.fileData.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = book.fileData;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  // 2. IndexedDB blob by book.id
  if (book.id) {
    const dbRecord = await getBookFileFromDB(book.id);
    if (dbRecord) {
      const blobUrl = URL.createObjectURL(dbRecord.blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = dbRecord.fileName || safeFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return true;
    }
  }

  // 3. External URL (Google Drive, Yandex Disk, direct cloud link)
  if (book.fileUrl) {
    // If it's a direct downloadable link or cloud drive, open in new tab
    const win = window.open(book.fileUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = book.fileUrl;
    }
    return true;
  }

  return false;
}
