import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, UploadCloud, Link2, FileText, Brain, AlertCircle, Compass, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';

interface AiGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (quiz: any) => void;
}

const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState<'file' | 'link' | 'prompt'>('file');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [prompt, setPrompt] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [category, setCategory] = useState('General');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);

    const loadingSteps = [
        "Reading and extracting text from source...",
        "Analyzing key concepts and structures...",
        "Crafting multiple-choice questions with Gemini AI...",
        "Formulating plausible wrong answer options...",
        "Setting correct answers and fast-response point rules...",
        "Finalizing your premium interactive quiz..."
    ];

    // Cycle through loading messages every 2.5 seconds
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
            }, 2500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading]);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    const validateAndSetFile = (file: File) => {
        setError(null);
        const validExtensions = ['.pdf', '.docx', '.pptx', '.txt', '.csv'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!validExtensions.includes(extension)) {
            setError("Unsupported file format! Please upload PDF, Word, PowerPoint, or Text files.");
            return;
        }

        // Limit size to 15MB
        if (file.size > 15 * 1024 * 1024) {
            setError("File size is too large! Maximum limit is 15MB.");
            return;
        }

        setFile(file);
    };

    const handleGenerate = async () => {
        setError(null);
        
        // Validation
        if (activeTab === 'file' && !file) {
            setError("Please upload a document to generate the quiz.");
            return;
        }
        if (activeTab === 'link' && !url) {
            setError("Please paste a website URL to generate the quiz.");
            return;
        }
        if (activeTab === 'prompt' && !prompt.trim()) {
            setError("Please write a custom topic or prompt to generate the quiz.");
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('num_questions', numQuestions.toString());
        formData.append('category', category);

        if (activeTab === 'file' && file) {
            formData.append('file', file);
            if (prompt.trim()) {
                formData.append('prompt', prompt);
            }
        } else if (activeTab === 'link' && url) {
            formData.append('url', url);
            if (prompt.trim()) {
                formData.append('prompt', prompt);
            }
        } else if (activeTab === 'prompt' && prompt) {
            formData.append('prompt', prompt);
        }

        try {
            const response = await fetch(`${API_BASE}/api/quizzes/generate`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to generate quiz. Please check backend config or your API Key.");
            }

            const generatedQuiz = await response.json();
            onSuccess(generatedQuiz);
            onClose();
        } catch (err: any) {
            console.error("AI Generation Error:", err);
            setError(err.message || "An unexpected error occurred during AI generation.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={!isLoading ? onClose : undefined}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                />

                {/* Main Dialog */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
                >
                    {/* Glowing Accent Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-purple-500" />

                    {/* Header */}
                    <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 rounded-2xl">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black dark:text-white flex items-center gap-1.5">
                                    AI Quiz Generator
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Create engaging interactive quizzes in seconds</p>
                            </div>
                        </div>
                        {!isLoading && (
                            <button 
                                onClick={onClose} 
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </header>

                    {/* Loading State Overlay */}
                    {isLoading ? (
                        <div className="flex-1 p-12 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 rounded-full border-4 border-teal-500/10 dark:border-teal-500/20" />
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 border-r-teal-500"
                                />
                                <div className="absolute inset-4 bg-teal-50 dark:bg-teal-950/30 rounded-full flex items-center justify-center">
                                    <Brain className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-bounce" />
                                </div>
                            </div>
                            <div className="text-center max-w-sm space-y-2">
                                <h4 className="text-lg font-bold dark:text-white">Conjuring Your Quiz...</h4>
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={loadingStep}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-sm text-teal-600 dark:text-teal-400 font-semibold"
                                    >
                                        {loadingSteps[loadingStep]}
                                    </motion.p>
                                </AnimatePresence>
                                <p className="text-xs text-slate-400">Please do not refresh or close this tab.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Tab Selectors */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                <TabButton 
                                    active={activeTab === 'file'} 
                                    onClick={() => setActiveTab('file')}
                                    icon={<UploadCloud className="w-4 h-4" />}
                                    label="Upload Document"
                                />
                                <TabButton 
                                    active={activeTab === 'link'} 
                                    onClick={() => setActiveTab('link')}
                                    icon={<Link2 className="w-4 h-4" />}
                                    label="Paste Link"
                                />
                                <TabButton 
                                    active={activeTab === 'prompt'} 
                                    onClick={() => setActiveTab('prompt')}
                                    icon={<Compass className="w-4 h-4" />}
                                    label="Topic Prompt"
                                />
                            </div>

                            {/* Content Areas Based on Tab */}
                            <div className="min-h-[160px]">
                                {activeTab === 'file' && (
                                    <div 
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                                            isDragOver 
                                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20' 
                                                : file 
                                                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' 
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-slate-700'
                                        }`}
                                        onClick={() => document.getElementById('ai-file-input')?.click()}
                                    >
                                        <input 
                                            id="ai-file-input"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.docx,.pptx,.txt,.csv"
                                            onChange={handleFileChange}
                                        />
                                        {file ? (
                                            <>
                                                <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 rounded-2xl mb-4">
                                                    <CheckCircle2 className="w-8 h-8" />
                                                </div>
                                                <h5 className="font-bold text-slate-800 dark:text-slate-100">{file.name}</h5>
                                                <p className="text-xs text-slate-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to process</p>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFile(null);
                                                    }}
                                                    className="mt-4 text-xs font-bold text-rose-500 hover:underline"
                                                >
                                                    Remove file
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl mb-4">
                                                    <UploadCloud className="w-8 h-8" />
                                                </div>
                                                <h5 className="font-bold text-slate-800 dark:text-slate-200">Drag & Drop your document here</h5>
                                                <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, PPTX, TXT up to 15MB</p>
                                                <span className="mt-4 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md">
                                                    Browse Files
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'link' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all">
                                            <Link2 className="text-slate-400 w-5 h-5 flex-shrink-0" />
                                            <input 
                                                type="url" 
                                                placeholder="Paste article, wiki, or lesson link (e.g. https://en.wikipedia.org/...)"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Our crawler will fetch the webpage contents and extract clean textual details to construct quiz questions.
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'prompt' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-teal-500 transition-all">
                                            <textarea 
                                                rows={4}
                                                placeholder="Enter a topic, course outline, or text paragraph (e.g. 'General Chemistry basics, focus on covalent bonding, include elements of the periodic table...')"
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white resize-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Instructions input (if document or link is uploaded) */}
                            {activeTab !== 'prompt' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                        Optional Focus Instructions
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 'focus on chapter 3 topics', 'make it easy difficulty', 'emphasize definitions'"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-teal-500 transition-all"
                                    />
                                </div>
                            )}

                            {/* Quiz Generation Parameters */}
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <FileText className="w-4 h-4" /> Number of Questions
                                    </label>
                                    <div className="flex gap-2">
                                        {[5, 10, 15, 20].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setNumQuestions(num)}
                                                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                                                    numQuestions === num 
                                                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-500' 
                                                        : 'border-slate-200 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {num} Qs
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <Compass className="w-4 h-4" /> Category Tag
                                    </label>
                                    <select 
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-teal-500"
                                    >
                                        <option value="General">General Knowledge</option>
                                        <option value="Science">Science & Maths</option>
                                        <option value="Tech">Technology & Code</option>
                                        <option value="History">History & Geography</option>
                                        <option value="Business">Business & Finance</option>
                                        <option value="Languages">Languages & Literature</option>
                                    </select>
                                </div>
                            </div>

                            {/* Error Warning Banner */}
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-rose-700 dark:text-rose-400 font-semibold leading-relaxed">
                                        {error}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    {!isLoading && (
                        <footer className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <button 
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleGenerate}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-600/20"
                            >
                                <Sparkles className="w-4 h-4 fill-current" /> Magic Generate
                            </button>
                        </footer>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black transition-all ${
            active 
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-800/80' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default AiGeneratorModal;
