import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, X, Folder, ChevronLeft, Video, Upload, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { uploadMemory, createFolder, getFolders, getMemories, deleteMemory, deleteFolder } from '../supabaseClient';

interface FolderType {
    id: string;
    name: string;
    created_at: string;
}

interface MemoryType {
    id: string;
    title: string;
    date: string;
    description: string;
    media_url?: string;
    image?: string;
    media_type?: 'image' | 'video';
    folder_id?: string;
}

export const Story: React.FC = () => {
    // State
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
    const [memories, setMemories] = useState<MemoryType[]>([]);

    // Modals
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [isAddingMemory, setIsAddingMemory] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState<MemoryType | null>(null); // For Lightbox

    // Form Data
    const [newFolderName, setNewFolderName] = useState('');
    const [newMemory, setNewMemory] = useState({ title: '', date: new Date().toISOString().split('T')[0], description: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        loadFolders();
    }, []);

    // Load memories when folder changes
    useEffect(() => {
        if (currentFolder) {
            loadMemories(currentFolder.id);
        }
    }, [currentFolder]);

    const loadFolders = async () => {
        try {
            const data = await getFolders();
            setFolders(data || []);
        } catch (error) {
            console.error('Error loading folders:', error);
        }
    };

    const loadMemories = async (folderId: string) => {
        try {
            const data = await getMemories(folderId);
            setMemories(data || []);
        } catch (error) {
            console.error('Error loading memories:', error);
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const folder = await createFolder(newFolderName);
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
            } catch (error) {
                console.error('Error deleting folder:', error);
                alert('No se pudo borrar la carpeta.');
            }
        }
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
        if (!newMemory.title || !selectedFile || !currentFolder) return;

        setIsUploading(true);
        try {
            const memory = await uploadMemory(
                selectedFile,
                newMemory.title,
                newMemory.description,
                newMemory.date,
                currentFolder.id
            );

            const updatedMemories = [memory, ...memories].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setMemories(updatedMemories);

            setNewMemory({ title: '', date: new Date().toISOString().split('T')[0], description: '' });
            setSelectedFile(null);
            setPreviewUrl(null);
            setIsAddingMemory(false);
        } catch (error) {
            alert('Error al subir el recuerdo. Intenta de nuevo.');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
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

    return (
        <div className="p-6 pb-24 min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    {currentFolder && (
                        <button
                            onClick={() => setCurrentFolder(null)}
                            className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} className="text-stone-800" />
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-stone-800">
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
                    <button
                        onClick={() => setIsAddingMemory(true)}
                        className="w-10 h-10 bg-soft-blush text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Plus size={24} />
                    </button>
                )}
            </header>

            {/* View: Folder Grid */}
            {!currentFolder && (
                <div className="grid grid-cols-2 gap-4">
                    {/* Love Map Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="col-span-2 mb-4 glass-card p-4 rounded-3xl cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-4 text-stone-500">
                            <MapPin size={18} />
                            <span className="text-sm font-medium uppercase tracking-wider">Mapa de Amor</span>
                        </div>
                        <div className="aspect-video bg-sage-green/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" />
                            <p className="text-sage-green font-medium z-10">Explorando el mundo juntos</p>
                        </div>
                    </motion.div>

                    {folders.map((folder) => (
                        <motion.div
                            key={folder.id}
                            className="relative group"
                        >
                            <motion.button
                                onClick={() => setCurrentFolder(folder)}
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                                whileTap={{ scale: 0.95 }}
                                className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center gap-3 text-center aspect-square w-full transition-colors"
                            >
                                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 shadow-sm">
                                    <Folder size={24} fill="currentColor" className="text-stone-300" />
                                </div>
                                <span className="font-bold text-stone-800 line-clamp-2 text-sm">{folder.name}</span>
                            </motion.button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFolder(folder.id);
                                }}
                                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-stone-400 hover:text-red-500 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* View: Folder Detail (Memories) */}
            {currentFolder && (
                <div className="relative pl-4 border-l-2 border-stone-200 space-y-8">
                    {memories.length === 0 && (
                        <div className="text-stone-400 italic text-sm pl-4 py-10">
                            Esta carpeta está vacía. ¡Agrega el primer recuerdo!
                        </div>
                    )}

                    {memories.map((memory, index) => (
                        <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pl-6 group"
                        >
                            {/* Dot */}
                            <div className="absolute -left-[21px] top-2 w-4 h-4 bg-soft-blush rounded-full border-4 border-sand" />

                            <div
                                className="glass-card p-5 rounded-2xl cursor-pointer hover:shadow-md transition-shadow relative"
                                onClick={() => setSelectedMemory(memory)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-medium text-soft-blush uppercase tracking-wider block">
                                        {format(parseISO(memory.date), "d 'de' MMMM, yyyy", { locale: es })}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMemory(memory.id);
                                        }}
                                        className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-stone-800 mb-2">{memory.title}</h3>
                                {memory.description && (
                                    <p className="text-stone-600 text-sm mb-3 line-clamp-2">{memory.description}</p>
                                )}
                                {(memory.media_url || memory.image) && (
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-stone-100">
                                        {memory.media_type === 'video' ? (
                                            <video src={memory.media_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img
                                                src={memory.media_url || memory.image}
                                                alt={memory.title}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        {memory.media_type === 'video' && (
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
                    ))}
                </div>
            )}

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
                            className="bg-white w-full max-w-sm rounded-3xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Nueva Carpeta</h2>
                                <button onClick={() => setIsAddingFolder(false)} className="p-2 bg-stone-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateFolder}>
                                <input
                                    autoFocus
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    placeholder="Nombre de la carpeta..."
                                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-soft-blush/20 transition-all mb-4"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-stone-800 text-white py-3 rounded-xl font-medium"
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
                            className="bg-white w-full max-w-md rounded-3xl p-6 pb-10 sm:pb-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Nuevo Recuerdo</h2>
                                <button onClick={() => setIsAddingMemory(false)} className="p-2 bg-stone-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateMemory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">Título</label>
                                    <input
                                        required
                                        value={newMemory.title}
                                        onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-soft-blush/20 transition-all"
                                        placeholder="Ej. Cena de aniversario"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">Fecha</label>
                                    <input
                                        required
                                        type="date"
                                        value={newMemory.date}
                                        onChange={e => setNewMemory({ ...newMemory, date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-soft-blush/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">Descripción / Anécdota</label>
                                    <textarea
                                        value={newMemory.description}
                                        onChange={e => setNewMemory({ ...newMemory, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-soft-blush/20 transition-all resize-none h-24"
                                        placeholder="La noche que nos reímos tanto que..."
                                    />
                                </div>

                                {/* Custom File Input */}
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
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
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

                                <button
                                    type="submit"
                                    disabled={!selectedFile || !newMemory.title || isUploading}
                                    className="w-full bg-stone-800 text-white py-4 rounded-xl font-medium hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? 'Guardando...' : 'Guardar Recuerdo'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal: Lightbox (Full Screen Viewer) */}
            <AnimatePresence>
                {selectedMemory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => setSelectedMemory(null)}
                    >
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMemory(selectedMemory.id);
                                }}
                                className="p-2 bg-white/10 text-white rounded-full hover:bg-red-500/80 transition-colors"
                            >
                                <Trash2 size={24} />
                            </button>
                            <button
                                onClick={() => setSelectedMemory(null)}
                                className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div
                            className="w-full max-w-4xl max-h-[80vh] flex items-center justify-center mb-6"
                            onClick={e => e.stopPropagation()}
                        >
                            {(selectedMemory.media_url || selectedMemory.image) && (
                                selectedMemory.media_type === 'video' ? (
                                    <video
                                        src={selectedMemory.media_url}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                                    />
                                ) : (
                                    <img
                                        src={selectedMemory.media_url || selectedMemory.image}
                                        alt={selectedMemory.title}
                                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                    />
                                )
                            )}
                        </div>

                        <div
                            className="w-full max-w-2xl text-center text-white"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold mb-2">{selectedMemory.title}</h2>
                            <p className="text-white/80 text-lg leading-relaxed">{selectedMemory.description}</p>
                            <p className="text-white/50 text-sm mt-4">
                                {format(parseISO(selectedMemory.date), "d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
