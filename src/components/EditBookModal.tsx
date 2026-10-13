import React, { useState, useRef } from 'react';
import {
  BookOpen,
  X,
  Check,
  Trash2,
  Upload,
  FileText,
  File,
  Link,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { RoleBookRecommendation, RoleType } from '../types';
import { ROLES } from '../data/roles';
import {
  formatFileSize,
  readFileAsDataUrl,
  saveBookFileToDB,
  deleteBookFileFromDB,
} from '../services/bookStorage';

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleType: RoleType;
  book?: RoleBookRecommendation | null; // null if adding new book
  bookIndex?: number | null;
  onSave: (book: RoleBookRecommendation, index?: number | null) => void;
  onDelete?: (index: number) => void;
}

export const EditBookModal: React.FC<EditBookModalProps> = ({
  isOpen,
  onClose,
  roleType,
  book,
  bookIndex,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(book && bookIndex !== undefined && bookIndex !== null);
  const roleDef = ROLES[roleType];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [whyRead, setWhyRead] = useState(book?.whyRead || '');
  const [fileUrl, setFileUrl] = useState(book?.fileUrl || '');
  const [fileName, setFileName] = useState(book?.fileName || '');
  const [fileSize, setFileSize] = useState(book?.fileSize || '');
  const [fileData, setFileData] = useState(book?.fileData || '');
  const [fileType, setFileType] = useState(book?.fileType || '');

  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedLocalFile(file);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    setFileType(file.type || 'application/pdf');
    setError(null);
  };

  const handleRemoveAttachedFile = () => {
    setSelectedLocalFile(null);
    setFileName('');
    setFileSize('');
    setFileData('');
    setFileType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Укажите название книги');
      return;
    }
    if (!author.trim()) {
      setError('Укажите автора книги');
      return;
    }
    if (!whyRead.trim()) {
      setError('Опишите, почему эту книгу важно прочитать студенту');
      return;
    }

    setIsProcessingFile(true);

    try {
      const bookId = book?.id || `book_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      let finalFileData = fileData;
      let finalFileName = fileName;
      let finalFileSize = fileSize;
      let finalFileType = fileType;

      if (selectedLocalFile) {
        // Save to IndexedDB for large reliable offline downloads
        await saveBookFileToDB(bookId, selectedLocalFile);
        finalFileName = selectedLocalFile.name;
        finalFileSize = formatFileSize(selectedLocalFile.size);
        finalFileType = selectedLocalFile.type || 'application/pdf';

        // If file is reasonably sized (< 3 MB), also keep data URL so it can be downloaded across sessions
        if (selectedLocalFile.size < 3 * 1024 * 1024) {
          try {
            finalFileData = await readFileAsDataUrl(selectedLocalFile);
          } catch (readErr) {
            console.warn('Could not read as Data URL:', readErr);
          }
        } else {
          finalFileData = '';
        }
      }

      onSave(
        {
          id: bookId,
          title: title.trim(),
          author: author.trim(),
          whyRead: whyRead.trim(),
          fileUrl: fileUrl.trim() || undefined,
          fileName: finalFileName || undefined,
          fileSize: finalFileSize || undefined,
          fileData: finalFileData || undefined,
          fileType: finalFileType || undefined,
        },
        isEditing ? bookIndex : null
      );
      onClose();
    } catch (err: any) {
      console.error('Error saving book:', err);
      setError('Не удалось сохранить файл книги: ' + (err.message || 'неизвестная ошибка'));
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-indigo-300 shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Редактировать книгу' : 'Добавить книгу в книжную полку'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Цех: <span className="text-indigo-300 font-semibold">{roleDef?.title || roleType}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Название книги <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder="Например: Кино между адом и раем"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Автор книги <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  setError(null);
                }}
                placeholder="Например: Александр Митта"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Зачем стоит прочесть студенту <span className="text-rose-400">*</span>:
            </label>
            <textarea
              required
              rows={3}
              value={whyRead}
              onChange={(e) => {
                setWhyRead(e.target.value);
                setError(null);
              }}
              placeholder="Опишите, какую практическую пользу принесет книга при подготовке к съемкам..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* DOCUMENT ATTACHMENT SECTION (PDF, EPUB, DOCX) */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-indigo-950/70 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Электронный документ книги (для скачивания студентами)</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">PDF, EPUB, FB2, DOCX</span>
            </div>

            {/* Attached file status or upload button */}
            {fileName ? (
              <div className="p-3 bg-zinc-900 rounded-xl border border-indigo-800/80 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-indigo-900/40 border border-indigo-700/60 flex items-center justify-center text-indigo-300 shrink-0 font-bold text-[10px]">
                    PDF
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate" title={fileName}>
                      {fileName}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                      {fileSize && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                          {fileSize}
                        </span>
                      )}
                      <span className="text-emerald-400 font-medium">✓ Готов к скачиванию</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    Заменить
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAttachedFile}
                    title="Удалить прикрепленный документ"
                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-zinc-900/50 hover:bg-zinc-900 transition-all group"
              >
                <Upload className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                  Нажмите для загрузки файла книги с устройства
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Поддерживаются форматы PDF, EPUB, FB2, DOCX (до 100 МБ)
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.epub,.fb2,.doc,.docx,.djvu,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Alternative Cloud link */}
            <div className="pt-2 border-t border-zinc-850">
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-zinc-400" />
                <span>Или внешняя ссылка на файл / облако (Яндекс.Диск, Google Drive, облако ВУЗа):</span>
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://disk.yandex.ru/... или прямая ссылка на PDF"
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Если учебник очень большой или уже хранится на общем диске курса, укажите ссылку на просмотр и скачивание.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            {isEditing && onDelete && bookIndex !== undefined && bookIndex !== null ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Удалить книгу «${book?.title}» из рекомендаций?`)) {
                    onDelete(bookIndex);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить книгу</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessingFile}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isProcessingFile}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Сохранение файла...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? 'Сохранить изменения' : 'Добавить на полку'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
