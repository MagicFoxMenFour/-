import React, { useState, useMemo } from 'react';
import {
  FileText,
  Palette,
  Calendar,
  Headphones,
  Image as ImageIcon,
  FolderOpen,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  Search,
  Filter,
  Check,
  Film,
  Sparkles,
  Tag,
  Clock,
  User,
  X,
  FileCode,
} from 'lucide-react';
import { MediaAsset, MediaAssetType, FilmGroup, Participant } from '../types';

interface MediaLibraryProps {
  materials: MediaAsset[];
  groups: FilmGroup[];
  isAdmin: boolean;
  currentParticipant: Participant | null;
  onAddMaterial: (asset: MediaAsset) => void;
  onDeleteMaterial: (id: string) => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  materials,
  groups,
  isAdmin,
  currentParticipant,
  onAddMaterial,
  onDeleteMaterial,
}) => {
  const [activeType, setActiveType] = useState<'all' | MediaAssetType>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MediaAssetType>('script');
  const [newGroupId, setNewGroupId] = useState<string>(
    currentParticipant?.groupId || 'grp-1'
  );
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newPreviewUrl, setNewPreviewUrl] = useState('');
  const [newVersion, setNewVersion] = useState('v1.0');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('Сценарий, Драма');

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchesType = activeType === 'all' ? true : item.type === activeType;
      const matchesGroup =
        selectedGroupId === 'all'
          ? true
          : selectedGroupId === 'common'
          ? item.groupId === null
          : item.groupId === selectedGroupId;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesGroup && matchesSearch;
    });
  }, [materials, activeType, selectedGroupId, searchQuery]);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2500);
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFileUrl.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const authorName = isAdmin
      ? 'Продюсер лаборатории'
      : currentParticipant
      ? `${currentParticipant.name} (${currentParticipant.role})`
      : 'Участник лаборатории';

    const newAsset: MediaAsset = {
      id: `med-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      type: newType,
      groupId: newGroupId === 'common' ? null : newGroupId,
      fileUrl: newFileUrl.trim(),
      previewUrl: newPreviewUrl.trim() || undefined,
      version: newVersion.trim() || 'v1.0',
      uploadedBy: authorName,
      createdAt: new Date().toISOString(),
      tags: parsedTags,
    };

    onAddMaterial(newAsset);
    setIsAddModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewFileUrl('');
    setNewPreviewUrl('');
    setNewDescription('');
  };

  const getTypeMeta = (type: MediaAssetType) => {
    switch (type) {
      case 'script':
        return {
          label: 'Сценарий',
          icon: FileText,
          bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
        };
      case 'storyboard':
        return {
          label: 'Раскадровка',
          icon: Palette,
          bg: 'bg-purple-950/70 text-purple-300 border-purple-800',
        };
      case 'kpp':
        return {
          label: 'КПП / График',
          icon: Calendar,
          bg: 'bg-amber-950/70 text-amber-300 border-amber-800',
        };
      case 'sound':
        return {
          label: 'Звук / Музыка',
          icon: Headphones,
          bg: 'bg-blue-950/70 text-blue-300 border-blue-800',
        };
      case 'reference':
        return {
          label: 'Референсы / Регламент',
          icon: ImageIcon,
          bg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
      default:
        return {
          label: 'Материал',
          icon: FolderOpen,
          bg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <Film className="w-5 h-5 text-zinc-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Медиатека и производственные материалы
              </h2>
              <p className="text-xs text-zinc-400">
                Сценарии, раскадровки, календарно-постановочные планы (КПП) и экспликации съёмочных групп
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Добавить материал</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Type Tabs, Group Filter, Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs no-scrollbar">
          <button
            onClick={() => setActiveType('all')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeType === 'all'
                ? 'bg-zinc-800 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            Все ({materials.length})
          </button>
          <button
            onClick={() => setActiveType('script')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeType === 'script'
                ? 'bg-emerald-950 border border-emerald-700 text-emerald-200 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Сценарии</span>
          </button>
          <button
            onClick={() => setActiveType('storyboard')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeType === 'storyboard'
                ? 'bg-purple-950 border border-purple-700 text-purple-200 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Раскадровки</span>
          </button>
          <button
            onClick={() => setActiveType('kpp')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeType === 'kpp'
                ? 'bg-amber-950 border border-amber-700 text-amber-200 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>КПП и Графики</span>
          </button>
          <button
            onClick={() => setActiveType('reference')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeType === 'reference'
                ? 'bg-zinc-800 border border-zinc-650 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Референсы / Регламент</span>
          </button>
        </div>

        {/* Group Selector & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Group dropdown */}
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full sm:w-auto bg-zinc-950 border border-zinc-750 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-500"
          >
            <option value="all">Все фильмы лаборатории</option>
            <option value="common">Общие материалы лаборатории</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}: {g.projectTitle}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-750 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Materials */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
          <FolderOpen className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">Материалы не найдены</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            По заданным фильтрам нет загруженных документов. Вы можете добавить первый сценарий или раскадровку.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить материал</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 2xl:gap-5">
          {filteredMaterials.map((item) => {
            const typeMeta = getTypeMeta(item.type);
            const Icon = typeMeta.icon;
            const targetGroup = groups.find((g) => g.id === item.groupId);

            return (
              <div
                key={item.id}
                className="bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {/* Visual Thumbnail for Storyboard / Concept Art */}
                {item.previewUrl && (
                  <div className="relative h-36 w-full bg-zinc-950 overflow-hidden border-b border-zinc-800">
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-85 hover:opacity-100 hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-300 border border-zinc-800">
                      Раскадровка
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeMeta.bg}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{typeMeta.label}</span>
                      </span>

                      {item.version && (
                        <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-750">
                          {item.version}
                        </span>
                      )}
                    </div>

                    {/* Group assignment */}
                    <div className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1.5">
                      <Film className="w-3 h-3 text-zinc-500" />
                      <span>
                        {targetGroup
                          ? `${targetGroup.name}: «${targetGroup.projectTitle}»`
                          : 'Общие материалы лаборатории'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata and Actions */}
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="truncate" title={`Загрузил(а): ${item.uploadedBy}`}>
                        {item.uploadedBy}
                      </span>
                      <span className="shrink-0 font-mono">
                        {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700/80"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Открыть документ</span>
                      </a>

                      <button
                        onClick={() => handleCopyLink(item.fileUrl, item.id)}
                        title="Скопировать ссылку"
                        className="p-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-750 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => onDeleteMaterial(item.id)}
                          title="Удалить материал (только администратор)"
                          className="p-1.5 rounded-xl bg-zinc-850 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-750 hover:border-rose-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Добавить материал */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Добавить материал</h3>
                  <p className="text-xs text-zinc-400">Сценарий, раскадровка, КПП или референс</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Название документа *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Режиссёрская экспликация и раскадровка сцены 2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Тип материала *
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as MediaAssetType)}
                    className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-400"
                  >
                    <option value="script">📄 Сценарий / Драфт</option>
                    <option value="storyboard">🎨 Раскадровка / Storyboard</option>
                    <option value="kpp">📅 КПП / График смен</option>
                    <option value="sound">🎧 Звук / Музыка</option>
                    <option value="reference">🖼️ Референс / Регламент</option>
                    <option value="other">📁 Другой материал</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Съёмочная группа *
                  </label>
                  <select
                    value={newGroupId}
                    onChange={(e) => setNewGroupId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-400"
                  >
                    <option value="common">🌐 Общие материалы лаборатории</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}: {g.projectTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Ссылка на файл / ресурс *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://docs.google.com/document/... или ссылка на Figma/PDF"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Ссылка на превью / картинку (опционально)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images... (для раскадровок)"
                    value={newPreviewUrl}
                    onChange={(e) => setNewPreviewUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Версия документа
                  </label>
                  <input
                    type="text"
                    placeholder="Например: v1.0 или Draft 2"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Описание и режиссёрские заметки
                </label>
                <textarea
                  rows={3}
                  placeholder="Краткие примечания по сценам, оптике, звуку или правкам..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Теги (через запятую)
                </label>
                <input
                  type="text"
                  placeholder="Сценарий, Триллер, Локация"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all shadow-md"
                >
                  Сохранить материал
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
