import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Folder, ChevronLeft, Video, Upload, Trash2, Pencil, Loader2, Link as LinkIcon, ExternalLink, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { uploadMemory, createFolder, getFolders, getMemories, deleteMemory, deleteFolder, updateMemory, updateFolder } from '../supabaseClient';

interface FolderType {
    id: string;
    name: string;
    created_at: string;
    parent_id?: string;
}

interface MemoryType {
    id: string;
    title: string;
    date: string;
    description: string;
    media_url?: string;
    external_url?: string;
    image?: string;
    media_type?: 'image' | 'video';
    folder_id?: string;
}


const SafeImage = ({ src, alt, className }: { src?: string, alt: string, className?: string }) => {
    const [error, setError] = useState(false);

    if (error || !src) {
        return (
            <div className={`flex items-center justify-center bg-stone-100 dark:bg-stone-700 text-stone-400 ${className}`}>
                <div className="text-center p-4">
                    <span className="text-xs">Imagen no disponible</span>
                </div>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            className={className}
            onError={() => setError(true)}
        />
    );
};

const MemoryCard = React.memo(({ memory, index, onSelect, onDelete }: { memory: MemoryType, index: number, onSelect: (m: MemoryType) => void, onDelete: (id: string) => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }} // Reduced delay for faster feel
            className="relative pl-6 group"
        >
            {/* Dot */}
            <div className="absolute -left-[21px] top-2 w-4 h-4 bg-soft-blush rounded-full border-4 border-sand" />

            <div
                className="glass-card p-5 rounded-2xl cursor-pointer hover:shadow-md transition-shadow relative"
                onClick={() => onSelect(memory)}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-soft-blush uppercase tracking-wider block">
                        {format(parseISO(memory.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(memory.id);
                        }}
                        className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">{memory.title}</h3>
                {memory.description && (
                    <p className="text-stone-600 dark:text-stone-400 text-sm mb-3 line-clamp-2 break-words">{memory.description}</p>
                )}
                {(memory.media_url || memory.image || memory.external_url) && (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-stone-100">
                        {memory.external_url ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-200 text-stone-500">
                                <Video size={48} className="mb-2 text-soft-blush" />
                                <span className="text-xs font-medium uppercase tracking-wider">Video de Drive</span>
                            </div>
                        ) : memory.media_type === 'video' ? (
                            <video src={memory.media_url} className="w-full h-full object-cover" />
                        ) : (
                            <SafeImage
                                src={memory.media_url || memory.image}
                                alt={memory.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                        {(memory.media_type === 'video' || memory.external_url) && !memory.external_url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="bg-white/30 backdrop-blur-sm p-3 rounded-full">
                                    <Video className="text-white" size={24} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

export const Story: React.FC = () => {
    // State
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [folderPath, setFolderPath] = useState<FolderType[]>([]);
    const currentFolder = folderPath[folderPath.length - 1] || null;
    const [memories, setMemories] = useState<MemoryType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [isAddingMemory, setIsAddingMemory] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [isEditingMemory, setIsEditingMemory] = useState(false);
    const [isEditingFolder, setIsEditingFolder] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState<MemoryType | null>(null); // For Lightbox

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folder: FolderType } | null>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Form Data
    const [newFolderName, setNewFolderName] = useState('');
    const [editFolderName, setEditFolderName] = useState('');
    const [newMemory, setNewMemory] = useState({ title: '', date: new Date().toISOString().split('T')[0], description: '' });
    const [editMemoryData, setEditMemoryData] = useState({ title: '', date: '', description: '' });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Drive Integration State
    const [uploadMode, setUploadMode] = useState<'file' | 'drive'>('file');
    const [driveLink, setDriveLink] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);



    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const folder = await createFolder(newFolderName, currentFolder?.id);
            setFolders([...folders, folder]);
            setNewFolderName('');
            setIsAddingFolder(false);
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (window.confirm("¿Estás seguro? Se borrarán todas las fotos dentro de esta carpeta.")) {
            try {
                await deleteFolder(folderId);
                setFolders(folders.filter(f => f.id !== folderId));
                setContextMenu(null);
            } catch (error) {
                console.error('Error deleting folder:', error);
                alert('No se pudo borrar la carpeta.');
            }
        }
    };

    const handleRenameFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contextMenu || !editFolderName.trim()) return;

        try {
            const updated = await updateFolder(contextMenu.folder.id, editFolderName);
            setFolders(folders.map(f => f.id === contextMenu.folder.id ? updated : f));
            setIsEditingFolder(false);
            setContextMenu(null);
        } catch (error) {
            console.error('Error renaming folder:', error);
            alert('No se pudo renombrar la carpeta.');
        }
    };

    // Long Press Handlers
    const handleTouchStart = (e: React.TouchEvent, folder: FolderType) => {
        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        longPressTimer.current = setTimeout(() => {
            setContextMenu({ x, y, folder });
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleTouchMove = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleContextMenu = (e: React.MouseEvent, folder: FolderType) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, folder });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCreateMemory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemory.title || !currentFolder) return;
        if (uploadMode === 'file' && !selectedFile) return;
        if (uploadMode === 'drive' && !driveLink) return;

        setIsUploading(true);
        try {
            const memory = await uploadMemory(
                uploadMode === 'file' ? selectedFile : null,
                newMemory.title,
                newMemory.description,
                newMemory.date,
                currentFolder.id,
                uploadMode === 'drive' ? driveLink : undefined
            );

            const updatedMemories = [memory, ...memories].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setMemories(updatedMemories);

            setNewMemory({ title: '', date: new Date().toISOString().split('T')[0], description: '' });
            setSelectedFile(null);
            setPreviewUrl(null);
            setDriveLink('');
            setUploadMode('file');
            setIsAddingMemory(false);
        } catch (error: any) {
            alert(error.message || 'Error al subir el recuerdo. Intenta de nuevo.');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const getDriveEmbedUrl = (url: string) => {
        // Transform .../view to .../preview
        // Example: https://drive.google.com/file/d/123456789/view?usp=sharing -> https://drive.google.com/file/d/123456789/preview
        if (url.includes('/view')) {
            return url.replace('/view', '/preview');
        }
        return url;
    };

    const handleDeleteMemory = async (memoryId: string) => {
        if (window.confirm("¿Estás seguro de borrar este recuerdo?")) {
            try {
                await deleteMemory(memoryId);
                setMemories(memories.filter(m => m.id !== memoryId));
                if (selectedMemory?.id === memoryId) {
                    setSelectedMemory(null);
                }
            } catch (error) {
                console.error('Error deleting memory:', error);
                alert('No se pudo borrar el recuerdo.');
            }
        }
    };

    const openEditModal = (memory: MemoryType) => {
        setEditMemoryData({
            title: memory.title,
            date: memory.date ? memory.date.split('T')[0] : '',
            description: memory.description || ''
        });
        setIsEditingMemory(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemory) return;

        setIsUploading(true);
        try {
            const updated = await updateMemory(selectedMemory.id, editMemoryData);
            setMemories(memories.map(m => m.id === selectedMemory.id ? updated : m));
            setSelectedMemory(updated); // Update lightbox view
            setIsEditingMemory(false);
        } catch (error) {
            console.error('Error updating memory:', error);
            alert('No se pudo actualizar el recuerdo.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 pb-24 min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    {currentFolder && (
                        <button
                            onClick={() => setFolderPath(prev => prev.slice(0, -1))}
                            className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} className="text-stone-800 dark:text-stone-100" />
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                        {currentFolder ? currentFolder.name : 'Nuestra Historia 📖'}
                    </h1>
                </div>

                {!currentFolder ? (
                    <button
                        onClick={() => setIsAddingFolder(true)}
                        className="w-10 h-10 bg-stone-800 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Plus size={24} />
                    </button>
                ) : (
                    <div className="relative">
                        <button
                            onClick={() => setShowAddMenu(true)}
                            className="w-10 h-10 bg-soft-blush text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                )}
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-rose-400" size={48} />
                </div>
            ) : (
                <>
                    {/* View: Folder Grid (Always visible for current level) */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {folders.map((folder) => (
                            <motion.div
                                key={folder.id}
                                className="relative group select-none"
                                onContextMenu={(e) => handleContextMenu(e, folder)}
                                onTouchStart={(e) => handleTouchStart(e, folder)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                            >
                                <motion.button
                                    onClick={() => setFolderPath([...folderPath, folder])}
                                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="glass-card dark:bg-stone-800/60 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 text-center aspect-square w-full transition-colors"
                                >
                                    <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 shadow-sm">
                                        <Folder size={24} fill="currentColor" className="text-stone-300 dark:text-stone-500" />
                                    </div>
                                    <span className="font-bold text-stone-800 dark:text-stone-100 line-clamp-2 text-sm">{folder.name}</span>
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>

                    {currentFolder && (
                        <div className="relative pl-4 border-l-2 border-stone-200 space-y-8">
                            {memories.length === 0 && folders.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-stone-400 dark:text-stone-500 text-lg font-medium">
                                        No hay carpetas aún. ¡Crea la primera!
                                    </p>
                                </div>
                            )}

                            {memories.map((memory, index) => (
                                <MemoryCard
                                    key={memory.id}
                                    memory={memory}
                                    index={index}
                                    onSelect={setSelectedMemory}
                                    onDelete={handleDeleteMemory}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modal: Add Options Menu */}
            <AnimatePresence>
                {showAddMenu && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setShowAddMenu(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-3xl p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-6 text-center dark:text-stone-100">¿Qué deseas agregar?</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setShowAddMenu(false);
                                        setIsAddingFolder(true);
                                    }}
                                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-stone-200 dark:bg-stone-600 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300">
                                        <Folder size={24} />
                                    </div>
                                    <span className="font-medium text-stone-800 dark:text-stone-100">Sub-carpeta</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddMenu(false);
                                        setIsAddingMemory(true);
                                    }}
                                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-soft-blush/10 dark:bg-soft-blush/20 hover:bg-soft-blush/20 dark:hover:bg-soft-blush/30 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-soft-blush rounded-full flex items-center justify-center text-white">
                                        <Upload size={24} />
                                    </div>
                                    <span className="font-medium text-soft-blush dark:text-soft-blush">Recuerdo</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal: Create Folder */}
            <AnimatePresence>
                {isAddingFolder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-3xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold dark:text-stone-100">Nueva Carpeta</h2>
                                <button onClick={() => setIsAddingFolder(false)} className="p-2 bg-stone-100 dark:bg-stone-700 rounded-full dark:text-stone-300">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateFolder}>
                                <input
                                    autoFocus
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    placeholder="Nombre de la carpeta..."
                                    className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-700 border-transparent focus:bg-white dark:focus:bg-stone-600 focus:ring-2 focus:ring-soft-blush/20 transition-all mb-4 dark:text-stone-100 dark:placeholder:text-stone-400"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-stone-800 dark:bg-stone-900 text-white py-3 rounded-xl font-medium"
                                >
                                    Crear Carpeta
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal: Add Memory (Enhanced) */}
            <AnimatePresence>
                {isAddingMemory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="bg-white dark:bg-stone-800 w-full max-w-md rounded-3xl p-6 pb-10 sm:pb-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold dark:text-stone-100">Nuevo Recuerdo</h2>
                                <button onClick={() => setIsAddingMemory(false)} className="p-2 bg-stone-100 dark:bg-stone-700 rounded-full dark:text-stone-300">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateMemory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Título</label>
                                    <input
                                        required
                                        value={newMemory.title}
                                        onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-700 border-transparent focus:bg-white dark:focus:bg-stone-600 focus:ring-2 focus:ring-soft-blush/20 transition-all dark:text-stone-100 dark:placeholder:text-stone-400"
                                        placeholder="Ej. Cena de aniversario"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Fecha</label>
                                    <input
                                        required
                                        type="date"
                                        value={newMemory.date}
                                        onChange={e => setNewMemory({ ...newMemory, date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-700 border-transparent focus:bg-white dark:focus:bg-stone-600 focus:ring-2 focus:ring-soft-blush/20 transition-all dark:text-stone-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Descripción / Anécdota</label>
                                    <textarea
                                        value={newMemory.description}
                                        onChange={e => setNewMemory({ ...newMemory, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-700 border-transparent focus:bg-white dark:focus:bg-stone-600 focus:ring-2 focus:ring-soft-blush/20 transition-all resize-none h-24 dark:text-stone-100 dark:placeholder:text-stone-400"
                                        placeholder="La noche que nos reímos tanto que..."
                                    />
                                </div>

                                {/* Custom File Input */}
                                {/* Custom File Input / Drive Link Toggle */}
                                <div className="flex gap-2 mb-4 bg-stone-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setUploadMode('file')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${uploadMode === 'file'
                                            ? 'bg-white text-stone-800 shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                                            }`}
                                    >
                                        Subir Archivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUploadMode('drive')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${uploadMode === 'drive'
                                            ? 'bg-white text-stone-800 shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                                            }`}
                                    >
                                        Enlace de Drive
                                    </button>
                                </div>

                                {uploadMode === 'file' ? (
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-4 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-500 hover:border-soft-blush hover:text-soft-blush transition-colors"
                                        >
                                            {previewUrl ? (
                                                <div className="relative w-full h-32 px-4">
                                                    {selectedFile?.type.startsWith('video/') ? (
                                                        <video src={previewUrl} className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <img src={previewUrl} alt="Preview" loading="lazy" className="w-full h-full object-cover rounded-lg" />
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                                        <span className="text-white text-sm font-medium">Cambiar</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload size={24} className="mb-2" />
                                                    <span className="text-sm font-medium">Seleccionar Foto/Video</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <a
                                            href="https://drive.google.com/drive/folders/1wZ9HbaSj74oW9O5IfQOGtrqa0RXD1Cn6?usp=sharing"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            <Folder size={20} />
                                            📂 Ir a nuestra Carpeta de Videos
                                            <ExternalLink size={16} />
                                        </a>

                                        <div>
                                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Pegar Enlace del Video</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                                <input
                                                    type="url"
                                                    value={driveLink}
                                                    onChange={e => setDriveLink(e.target.value)}
                                                    placeholder="https://drive.google.com/file/d/..."
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-soft-blush/20 transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-stone-400 mt-1 ml-1">
                                                Copia el enlace del video desde la carpeta de Drive y pégalo aquí.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={(!selectedFile && !driveLink) || !newMemory.title || isUploading}
                                    className="w-full bg-stone-800 text-white py-4 rounded-xl font-medium hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? 'Guardando...' : 'Guardar Recuerdo'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Memory Modal */}
            <AnimatePresence>
                {isEditingMemory && selectedMemory && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-stone-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-4 dark:text-stone-100">Editar Recuerdo</h2>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <input
                                    type="text"
                                    value={editMemoryData.title}
                                    onChange={(e) => setEditMemoryData({ ...editMemoryData, title: e.target.value })}
                                    placeholder="Título..."
                                    className="w-full p-4 rounded-xl bg-stone-50 dark:bg-stone-700 border-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-600 dark:text-stone-100"
                                    required
                                />
                                <input
                                    type="date"
                                    value={editMemoryData.date}
                                    onChange={(e) => setEditMemoryData({ ...editMemoryData, date: e.target.value })}
                                    className="w-full p-4 rounded-xl bg-stone-50 dark:bg-stone-700 border-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-600 dark:text-stone-100"
                                    required
                                />
                                <textarea
                                    value={editMemoryData.description}
                                    onChange={(e) => setEditMemoryData({ ...editMemoryData, description: e.target.value })}
                                    placeholder="Descripción..."
                                    className="w-full p-4 rounded-xl bg-stone-50 dark:bg-stone-700 border-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-600 h-24 resize-none dark:text-stone-100"
                                />

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingMemory(false)}
                                        className="flex-1 py-3 rounded-xl font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                                        disabled={isUploading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 rounded-xl font-medium bg-stone-800 dark:bg-stone-900 text-white hover:bg-stone-900 dark:hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <Loader2 className="animate-spin" /> : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedMemory && !isEditingMemory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex flex-col"
                    >
                        <div className="p-4 flex justify-between items-center text-white/80">
                            <button onClick={() => setSelectedMemory(null)} className="p-2 hover:bg-white/10 rounded-full">
                                <X size={24} />
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(selectedMemory)}
                                    className="p-2 hover:bg-white/10 rounded-full text-blue-300"
                                    title="Editar"
                                >
                                    <Pencil size={24} />
                                </button>
                                <button
                                    onClick={() => handleDeleteMemory(selectedMemory.id)}
                                    className="p-2 hover:bg-white/10 rounded-full text-red-400"
                                    title="Borrar"
                                >
                                    <Trash2 size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                            {selectedMemory.external_url ? (
                                <iframe
                                    src={getDriveEmbedUrl(selectedMemory.external_url)}
                                    className="w-full h-full rounded-lg"
                                    allow="autoplay; fullscreen"
                                    title={selectedMemory.title}
                                />
                            ) : selectedMemory.media_type === 'video' ? (
                                <video
                                    src={selectedMemory.media_url}
                                    className="max-w-full max-h-full rounded-lg"
                                    controls
                                    autoPlay
                                />
                            ) : (
                                <motion.img
                                    layoutId={selectedMemory.id}
                                    src={selectedMemory.media_url || selectedMemory.image}
                                    alt={selectedMemory.title}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            )}
                        </div>

                        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent text-white space-y-2">
                            <h2 className="text-2xl font-bold">{selectedMemory.title}</h2>
                            <p className="text-white/60 text-sm">
                                {selectedMemory.date && format(parseISO(selectedMemory.date), "d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                            {selectedMemory.description && (
                                <p className="text-white/80 leading-relaxed max-w-2xl">
                                    {selectedMemory.description}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setContextMenu(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                            className="fixed z-50 bg-white dark:bg-stone-800 rounded-xl shadow-xl p-2 min-w-[160px] flex flex-col gap-1"
                        >
                            <button
                                onClick={() => {
                                    setEditFolderName(contextMenu.folder.name);
                                    setIsEditingFolder(true);
                                    setContextMenu(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg text-sm w-full text-left"
                            >
                                <Edit2 size={16} />
                                Cambiar nombre
                            </button>
                            <button
                                onClick={() => handleDeleteFolder(contextMenu.folder.id)}
                                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm w-full text-left"
                            >
                                <Trash2 size={16} />
                                Borrar carpeta
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Rename Folder Modal */}
            <AnimatePresence>
                {isEditingFolder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-3xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold dark:text-stone-100">Renombrar Carpeta</h2>
                                <button onClick={() => setIsEditingFolder(false)} className="p-2 bg-stone-100 dark:bg-stone-700 rounded-full dark:text-stone-300">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleRenameFolder}>
                                <input
                                    autoFocus
                                    value={editFolderName}
                                    onChange={e => setEditFolderName(e.target.value)}
                                    placeholder="Nombre de la carpeta..."
                                    className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-700 border-transparent focus:bg-white dark:focus:bg-stone-600 focus:ring-2 focus:ring-soft-blush/20 transition-all mb-4 dark:text-stone-100"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-stone-800 dark:bg-stone-900 text-white py-3 rounded-xl font-medium"
                                >
                                    Guardar Cambios
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
