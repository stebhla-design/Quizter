import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Play, ChevronRight, BarChart2, Crown, Timer, Info, Trophy, Rocket, Loader2, Copy } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { motion, AnimatePresence } from 'framer-motion';

const LiveHost: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { currentSession, joinSession, broadcastAction, loading } = useQuiz();
    const [status, setStatus] = useState<'waiting' | 'active' | 'finished'>('waiting');
    const [participantCount, setParticipantCount] = useState(0);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        const recover = async () => {
            if (!currentSession && sessionId) {
                await joinSession(sessionId);
            }
        };
        recover();
    }, [sessionId, currentSession, joinSession]);

    useEffect(() => {
        if (!sessionId) return;
        const fetchParticipants = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}/participants`);
                const data = await res.json();
                setParticipantCount(data.length);
                setLeaderboard(data.map((p: any) => ({
                    ...p,
                    totalCorrect: 0,
                    totalTime: 0,
                    finished: false
                })));
            } catch (err) {
                console.error("Failed to fetch participants:", err);
            }
        };
        fetchParticipants();
    }, [sessionId]);

    const quiz = currentSession?.quiz;

    useEffect(() => {
        if (!sessionId) return;
        const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'PARTICIPANT_JOINED') {
                const { name, email } = data.payload;
                setParticipantCount(prev => prev + 1);
                setLeaderboard(prev => {
                    if (!prev.find(p => p.name === name || (email && p.email === email))) {
                        return [...prev, { name, email, totalCorrect: 0, totalTime: 0, finished: false }];
                    }
                    return prev;
                });
            } else if (data.type === 'PARTICIPANT_FINISHED') {
                const { name, totalCorrect, totalTime } = data.payload;
                setLeaderboard(prev => {
                    const existing = prev.find(p => p.name === name);
                    if (existing) {
                        return prev.map(p => p.name === name ? { ...p, totalCorrect, totalTime, finished: true } : p);
                    } else {
                        return [...prev, { name, totalCorrect, totalTime, finished: true }];
                    }
                });
            }
        };

        return () => ws.close();
    }, [sessionId]);

    const startQuiz = () => {
        setStatus('active');
        broadcastAction({ type: 'START_QUIZ' });
    };

    const sortedLeaderboard = [...leaderboard].sort((a, b) => {
        if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
        return a.totalTime - b.totalTime;
    });

    if (loading || !quiz) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
                <p className="text-slate-400 font-bold">Loading session data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
            <header className="p-6 flex justify-between items-center bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="bg-teal-600 px-4 py-2 rounded-xl font-black text-lg">CODE: {sessionId}</div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold">
                        <Users className="w-5 h-5" /> {participantCount} joined
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-black tracking-tight">{quiz?.title}</h2>
                    <p className="text-xs text-teal-500 font-black uppercase tracking-widest">Self-Paced Mode</p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl font-bold transition-all">End Session</button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-y-auto">
                <AnimatePresence mode="wait">
                    {status === 'waiting' && (
                        <motion.div 
                            key="waiting"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="text-center w-full max-w-4xl"
                        >
                            <div className="text-sm font-black uppercase tracking-[0.3em] text-teal-400 mb-4">Lobby</div>
                            <h1 className="text-7xl font-black mb-12">Waiting for challengers</h1>
                            
                            <div className="grid md:grid-cols-2 gap-8 mb-12">
                                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center">
                                    <div className="w-48 h-48 bg-white p-4 rounded-2xl mb-6 shadow-2xl">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/join/${sessionId}`)}`} 
                                            alt="Scan to join" 
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <p className="text-slate-400 font-bold">Scan to join instantly</p>
                                </div>
                                
                                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col justify-center text-left">
                                    <p className="text-slate-400 font-bold mb-2 uppercase tracking-wider text-xs">Direct Link</p>
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-teal-400 break-all mb-4 text-sm">
                                        {window.location.origin}/join/{sessionId}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/join/${sessionId}`);
                                            alert("Invite link copied!");
                                        }}
                                        className="flex items-center gap-2 text-white font-bold hover:text-teal-400 transition-all"
                                    >
                                        <Copy className="w-5 h-5" /> Copy Invite Link
                                    </button>
                                </div>
                            </div>

                            <button onClick={startQuiz} className="bg-teal-600 text-white px-12 py-6 rounded-3xl text-3xl font-black hover:bg-teal-500 transition-all shadow-2xl shadow-teal-600/20 active:scale-95 flex items-center gap-4 mx-auto">
                                <Play className="w-8 h-8 fill-current" /> Start Challenge
                            </button>
                        </motion.div>
                    )}

                    {status === 'active' && (
                        <motion.div 
                            key="active"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-4xl"
                        >
                            <div className="flex justify-between items-end mb-12">
                                <div>
                                    <h1 className="text-5xl font-black mb-2">Live Rankings</h1>
                                    <p className="text-slate-400 font-bold">Sorted by Accuracy & Speed</p>
                                </div>
                                <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                                    <span className="text-xs font-black text-slate-500 uppercase block">Active Participants</span>
                                    <span className="text-2xl font-black text-teal-500">{participantCount}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {sortedLeaderboard.length === 0 ? (
                                    <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                        <Loader2 className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">Waiting for first result...</p>
                                    </div>
                                ) : (
                                    sortedLeaderboard.map((p, i) => (
                                        <motion.div 
                                            key={p.name}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-6 rounded-3xl flex justify-between items-center transition-all ${p.finished ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/5 opacity-60'}`}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`w-10 h-10 flex items-center justify-center font-black rounded-xl ${i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-800 text-white' : 'bg-white/10 text-slate-400'}`}>
                                                    {i + 1}
                                                </div>
                                                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center font-bold text-xl overflow-hidden shadow-lg">
                                                    {p.name[0]}
                                                </div>
                                                <div>
                                                    <span className="text-2xl font-bold block">{p.name}</span>
                                                    {!p.finished && <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest animate-pulse">In Progress...</span>}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-8 items-center">
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase block">Correct</span>
                                                    <span className={`text-2xl font-black ${p.finished ? 'text-teal-400' : 'text-slate-600'}`}>{p.totalCorrect} / {quiz.questions.length}</span>
                                                </div>
                                                <div className="text-right w-24">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase block">Time</span>
                                                    <span className={`text-2xl font-black ${p.finished ? 'text-white' : 'text-slate-600'}`}>{p.finished ? `${p.totalTime.toFixed(1)}s` : '--'}</span>
                                                </div>
                                                {p.finished && i === 0 && <Crown className="w-6 h-6 text-amber-500 fill-current" />}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <div className="p-6 bg-white/5 border-t border-white/10 flex justify-center items-center gap-12">
                <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-bold text-slate-400">Total Questions: {quiz.questions.length}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-teal-500" />
                    <span className="text-sm font-bold text-slate-400">Mode: Self-Paced Challenge</span>
                </div>
            </div>
        </div>
    );
};

export default LiveHost;
