import React, { useState, useEffect } from 'react';
import { Layout, List, LayoutGrid, FileText, Settings, Plus, Play, Edit3, Trash2, Search, Lock } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const Dashboard: React.FC = () => {
    const { quizzes, fetchQuizzes, startLiveSession, deleteQuiz, saveQuiz } = useQuiz();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const handleCreateQuiz = async () => {
        console.log("Creating new quiz...");
        const tempId = Math.random().toString(36).substring(7);
        const newQuiz = {
            id: tempId,
            title: "Untitled Quiz",
            category: "General",
            description: "New quiz description",
            questions: [
                {
                    id: 'q1',
                    text: "",
                    type: 'select' as const,
                    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                    correctAnswers: [0],
                    timerSeconds: 20,
                    points: 1000
                }
            ]
        };
        console.log("Navigating to builder:", tempId);
        navigate(`/builder/${tempId}`);
        console.log("Saving quiz to backend...");
        await saveQuiz(newQuiz);
        console.log("Quiz saved successfully.");
    };

    const stats = [
        { label: 'Total Quizzes', value: quizzes.length, icon: <List className="w-5 h-5" /> },
        { label: 'Active Sessions', value: '0', icon: <Play className="w-5 h-5 text-teal-600" /> },
        { label: 'Total Players', value: '0', icon: <LayoutGrid className="w-5 h-5 text-blue-600" /> },
        { label: 'Avg Score', value: '0%', icon: <FileText className="w-5 h-5 text-purple-600" /> }
    ];

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col">
                <Logo className="flex items-center gap-2 mb-12" />
                <nav className="flex-1 space-y-2">
                    <SidebarLink icon={<Layout className="w-5 h-5" />} label="Home" path="/dashboard" active />
                    <SidebarLink icon={<List className="w-5 h-5" />} label="My Quizzes" path="/dashboard" />
                    <SidebarLink icon={<LayoutGrid className="w-5 h-5" />} label="Templates" path="/dashboard" />
                    <SidebarLink icon={<FileText className="w-5 h-5" />} label="Reports" path="/reports" />
                </nav>
                <div className="space-y-2">
                    <SidebarLink icon={<Settings className="w-5 h-5" />} label="Settings" path="/dashboard" />
                    <button 
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('userEmail');
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                        <Lock className="w-5 h-5" /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-12">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Host Dashboard</h1>
                        <p className="text-slate-500 font-medium">Manage your quizzes and track live engagement.</p>
                    </div>
                    <button 
                        onClick={handleCreateQuiz}
                        className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                    >
                        <Plus className="w-5 h-5" /> Create New Quiz
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">{stat.icon}</div>
                            </div>
                            <div className="text-3xl font-bold">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Search & List */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Recent Quizzes</h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search quizzes..." 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-10 pr-6 py-2.5 rounded-xl w-64 focus:outline-none focus:border-teal-500 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {quizzes.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <List className="w-8 h-8 text-slate-300" />
                            </div>
                            <h4 className="text-lg font-bold mb-2">No quizzes found</h4>
                            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Start from scratch or use a template to create your first engaging quiz.</p>
                            <button className="bg-teal-600/10 text-teal-600 px-6 py-3 rounded-2xl font-bold hover:bg-teal-600/20 transition-all">
                                Explore Templates
                            </button>
                        </div>
                    ) : (
                        quizzes.map(quiz => (
                            <QuizRow 
                                key={quiz.id} 
                                quiz={quiz} 
                                onLaunch={async () => {
                                    const sessionId = await startLiveSession(quiz.id);
                                    if (sessionId) navigate(`/host/${sessionId}`);
                                }} 
                                onDelete={() => deleteQuiz(quiz.id)}
                            />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

const SidebarLink = ({ icon, label, active, path }: { icon: React.ReactNode, label: string, active?: boolean, path: string }) => {
    const navigate = useNavigate();
    return (
        <button 
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${active ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shadow-sm border border-teal-100 dark:border-teal-800' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
            {icon} <span>{label}</span>
        </button>
    );
};

const QuizRow = ({ quiz, onLaunch, onDelete }: { quiz: any, onLaunch: () => void, onDelete: () => void }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group hover:shadow-lg transition-all">
            <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center text-teal-600">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-lg font-bold mb-1 group-hover:text-teal-600 transition-colors">{quiz.title}</h4>
                    <p className="text-sm text-slate-400 font-medium">{quiz.questions.length} Questions • {quiz.category} • Created Recently</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onLaunch} className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"><Play className="w-5 h-5 fill-current" /></button>
                <button 
                    onClick={() => navigate(`/builder/${quiz.id}`)}
                    className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    <Edit3 className="w-5 h-5" />
                </button>
                <button 
                    onClick={onDelete}
                    className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
