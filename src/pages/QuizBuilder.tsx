import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Clock, Trophy, Zap, ChevronLeft, Save, Layout, CheckCircle2, LayoutGrid, BarChart2, Edit3 } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { motion, Reorder } from 'framer-motion';

const QuizBuilder: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { quizzes, saveQuiz: saveQuizContext } = useQuiz();
    
    // Find or create quiz
    const [quiz, setQuiz] = useState<any>(null);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    useEffect(() => {
        const existing = quizzes.find(q => q.id === id);
        if (existing) {
            setQuiz(existing);
        } else {
            setQuiz({
                id,
                title: 'Untitled Quiz',
                category: 'General',
                questions: [
                    { id: '1', type: 'select', text: '', options: ['', ''], correctAnswers: [0], timerSeconds: 20, points: 1000, fastBonus: true }
                ]
            });
        }
    }, [id, quizzes]);

    const activeQuestion = quiz?.questions[activeQuestionIndex];

    const updateQuestion = (updates: any) => {
        const newQuestions = [...quiz.questions];
        newQuestions[activeQuestionIndex] = { ...activeQuestion, ...updates };
        setQuiz({ ...quiz, questions: newQuestions });
    };

    const addQuestion = () => {
        const newQuestion = { 
            id: Date.now().toString(), 
            type: 'select', 
            text: '', 
            options: ['', ''], 
            correctAnswers: [0], 
            timerSeconds: 20, 
            points: 1000, 
            fastBonus: true 
        };
        setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
        setActiveQuestionIndex(quiz.questions.length);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateQuestion({ imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const deleteQuestion = (index: number) => {
        if (quiz.questions.length <= 1) return;
        const newQuestions = quiz.questions.filter((_: any, i: number) => i !== index);
        setQuiz({ ...quiz, questions: newQuestions });
        setActiveQuestionIndex(Math.max(0, index - 1));
    };

    const saveQuiz = async () => {
        await saveQuizContext(quiz);
        navigate('/dashboard');
    };

    if (!quiz || !activeQuestion) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-bold">Loading Builder...</div>;

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Top Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <ChevronLeft />
                    </button>
                    <input 
                        type="text" 
                        value={quiz.title} 
                        onChange={(e) => setQuiz({...quiz, title: e.target.value})}
                        className="text-xl font-bold bg-transparent border-none focus:ring-0 w-64"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={saveQuiz} className="btn btn-primary gap-2">
                        <Save className="w-4 h-4" /> Save Quiz
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Question List */}
                <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {quiz.questions.map((q: any, i: number) => (
                            <div 
                                key={q.id}
                                onClick={() => setActiveQuestionIndex(i)}
                                className={`relative group p-4 rounded-2xl border-2 transition-all cursor-pointer ${activeQuestionIndex === i ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                            >
                                <span className="absolute top-2 left-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Q{i+1}</span>
                                <div className="mt-2 text-sm font-bold line-clamp-2 min-h-[40px]">
                                    {q.text || <span className="text-slate-300 italic">Empty Question</span>}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteQuestion(i); }}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <button onClick={addQuestion} className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                            <Plus className="w-5 h-5" /> Add Question
                        </button>
                    </div>
                </aside>

                {/* Main Content: Question Editor */}
                <main className="flex-1 overflow-y-auto p-12 bg-slate-50 dark:bg-slate-950">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Question Input */}
                        <div className="relative">
                            <textarea 
                                value={activeQuestion.text}
                                onChange={(e) => updateQuestion({ text: e.target.value })}
                                placeholder="Type your question here..."
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-3xl font-black text-center focus:border-teal-500 focus:ring-0 transition-all min-h-[160px] resize-none"
                            />
                        </div>

                        {/* Image Support */}
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                                    <LayoutGrid className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold">Visual Aid</h4>
                                    <p className="text-xs text-slate-500">Upload an image to show during the quiz.</p>
                                </div>
                                <label className="cursor-pointer bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all">
                                    Upload Image
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                            
                            {activeQuestion.imageUrl && (
                                <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800">
                                    <img src={activeQuestion.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                    <button 
                                        onClick={() => updateQuestion({ imageUrl: '' })}
                                        className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Options Grid for Multiple Choice */}
                        {activeQuestion.type === 'select' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    {activeQuestion.options.map((option: string, i: number) => (
                                        <div key={i} className="relative group">
                                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${activeQuestion.correctAnswers.includes(i) ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <input 
                                                type="text" 
                                                value={option}
                                                onChange={(e) => {
                                                    const newOptions = [...activeQuestion.options];
                                                    newOptions[i] = e.target.value;
                                                    updateQuestion({ options: newOptions });
                                                }}
                                                placeholder={`Option ${i+1}`}
                                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 pl-16 pr-24 py-5 rounded-2xl font-bold focus:border-teal-500 focus:ring-0 transition-all"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                {activeQuestion.options.length > 2 && (
                                                    <button 
                                                        onClick={() => {
                                                            const newOptions = activeQuestion.options.filter((_: any, idx: number) => idx !== i);
                                                            const newCorrect = activeQuestion.correctAnswers
                                                                .filter((idx: number) => idx !== i)
                                                                .map((idx: number) => idx > i ? idx - 1 : idx);
                                                            updateQuestion({ options: newOptions, correctAnswers: newCorrect });
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        const current = activeQuestion.correctAnswers || [];
                                                        const isCorrect = current.includes(i);
                                                        let newCorrect;
                                                        if (isCorrect) {
                                                            newCorrect = current.filter((idx: number) => idx !== i);
                                                        } else {
                                                            newCorrect = [...current, i];
                                                        }
                                                        updateQuestion({ correctAnswers: newCorrect });
                                                    }}
                                                    className={`p-2 rounded-xl transition-all ${activeQuestion.correctAnswers.includes(i) ? 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'text-slate-300 hover:text-teal-500'}`}
                                                >
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {activeQuestion.options.length < 6 && (
                                    <button 
                                        onClick={() => {
                                            updateQuestion({ options: [...activeQuestion.options, ''] });
                                        }}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold hover:border-teal-500 hover:text-teal-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Add Option
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Word Cloud UI */}
                        {activeQuestion.type === 'wordcloud' && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="inline-block p-4 bg-teal-500/10 rounded-full mb-6">
                                    <Layout className="w-12 h-12 text-teal-500" />
                                </motion.div>
                                <h3 className="text-2xl font-black mb-2">Word Cloud Preview</h3>
                                <p className="text-slate-500">Participants can enter up to 3 words each. These will appear live on your screen.</p>
                            </div>
                        )}

                        {/* Scale UI */}
                        {activeQuestion.type === 'scale' && (
                            <div className="space-y-6">
                                {activeQuestion.options.map((option: string, i: number) => (
                                    <div key={i} className="flex items-center gap-6">
                                        <input 
                                            type="text" 
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...activeQuestion.options];
                                                newOptions[i] = e.target.value;
                                                updateQuestion({ options: newOptions });
                                            }}
                                            placeholder={`Rating item ${i+1}`}
                                            className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 px-8 py-5 rounded-2xl font-bold"
                                        />
                                        <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Panel: Settings */}
                <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-8 space-y-8">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Question Type</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <TypeButton icon={<Layout />} label="Select" active={activeQuestion.type === 'select'} onClick={() => updateQuestion({ type: 'select' })} />
                            <TypeButton icon={<LayoutGrid />} label="Word Cloud" active={activeQuestion.type === 'wordcloud'} onClick={() => updateQuestion({ type: 'wordcloud' })} />
                            <TypeButton icon={<BarChart2 />} label="Scale" active={activeQuestion.type === 'scale'} onClick={() => updateQuestion({ type: 'scale' })} />
                            <TypeButton icon={<Edit3 className="w-4 h-4" />} label="Type Answer" active={activeQuestion.type === 'type'} onClick={() => updateQuestion({ type: 'type' })} />
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Timing & Points</h4>
                        <SettingRow icon={<Clock />} label="Time Limit">
                            <select 
                                value={activeQuestion.timerSeconds} 
                                onChange={(e) => updateQuestion({ timerSeconds: parseInt(e.target.value) })}
                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-bold"
                            >
                                <option value="5">5s</option>
                                <option value="10">10s</option>
                                <option value="20">20s</option>
                                <option value="30">30s</option>
                                <option value="60">60s</option>
                            </select>
                        </SettingRow>
                        <SettingRow icon={<Trophy />} label="Points">
                            <select 
                                value={activeQuestion.points}
                                onChange={(e) => updateQuestion({ points: parseInt(e.target.value) })}
                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-bold"
                            >
                                <option value="0">None</option>
                                <option value="1000">1000</option>
                                <option value="2000">2000</option>
                            </select>
                        </SettingRow>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Zap className="text-amber-500 w-5 h-5" />
                                <span className="text-sm font-bold">Fast Bonus</span>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={activeQuestion.fastBonus}
                                onChange={(e) => updateQuestion({ fastBonus: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

const TypeButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${active ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-slate-200'}`}
    >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
);

const SettingRow = ({ icon, label, children }: { icon: any, label: string, children: React.ReactNode }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-500">
            {React.cloneElement(icon, { className: 'w-4 h-4' })}
            <span className="text-sm font-semibold">{label}</span>
        </div>
        {children}
    </div>
);

export default QuizBuilder;
