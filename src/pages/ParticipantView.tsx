import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Timer, Loader2, User } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

const ParticipantView: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { currentSession, joinSession, broadcastAction, loading } = useQuiz();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [status, setStatus] = useState<'joining' | 'waiting' | 'active' | 'result' | 'finished'>('joining');
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

    useEffect(() => {
        const recover = async () => {
            if (!currentSession && sessionId) {
                await joinSession(sessionId);
            }
        };
        recover();
    }, [sessionId, currentSession, joinSession]);

    const quiz = currentSession?.quiz;
    const currentQuestion = quiz?.questions?.[questionIndex];

    useEffect(() => {
        if (!sessionId) return;
        
        const wsUrl = `ws://localhost:8000/ws/${sessionId}`;
        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'START_QUIZ') {
                setStatus('active');
                setQuizStartTime(Date.now());
                setStartTime(Date.now());
            }
        };

        return () => ws.close();
    }, [sessionId]);

    useEffect(() => {
        if (currentSession?.status === 'active' && status === 'waiting') {
            setStatus('active');
            setQuizStartTime(Date.now());
            setStartTime(Date.now());
        }
    }, [currentSession, status]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && email.trim()) {
            setIsJoined(true);
            setStatus('waiting');
            broadcastAction({
                type: 'PARTICIPANT_JOINED',
                payload: { 
                    name: name.trim(),
                    email: email.trim()
                }
            });
        }
    };

    const handleOptionClick = (index: number) => {
        if (status !== 'active' || !currentQuestion) return;

        const isMulti = currentQuestion.correctAnswers.length > 1;
        
        if (isMulti) {
            setSelectedAnswers(prev => 
                prev.includes(index) 
                    ? prev.filter(i => i !== index)
                    : [...prev, index]
            );
        } else {
            submitAnswer([index]);
        }
    };

    const submitAnswer = (indices: number[]) => {
        if (status !== 'active' || !currentQuestion) return;
        
        // Check if selection matches correct answers exactly
        const correctAnswers = currentQuestion.correctAnswers;
        const isMatch = indices.length === correctAnswers.length && 
                        indices.every(val => correctAnswers.includes(val));
        
        setSelectedAnswers(indices);
        setIsCorrect(isMatch);
        if (isMatch) setTotalCorrect(prev => prev + 1);
        setStatus('result');
    };

    const handleNext = () => {
        if (questionIndex < (quiz?.questions?.length || 0) - 1) {
            setQuestionIndex(prev => prev + 1);
            setSelectedAnswers([]);
            setIsCorrect(null);
            setStatus('active');
            setStartTime(Date.now());
        } else {
            const finalTime = (Date.now() - (quizStartTime || 0)) / 1000;
            setStatus('finished');
            broadcastAction({
                type: 'PARTICIPANT_FINISHED',
                payload: {
                    name,
                    totalCorrect,
                    totalTime: finalTime
                }
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center font-sans">
            <AnimatePresence mode="wait">
                {status === 'joining' && (
                    <motion.div 
                        key="joining"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md text-center"
                    >
                        <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-600/20">
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-black mb-4">Join the Quiz</h1>
                        <p className="text-slate-400 mb-8 font-medium">Enter your details to participate.</p>
                        <form onSubmit={handleJoin} className="space-y-4 text-left">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Nickname</label>
                                <input 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. QuizMaster"
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-4 px-6 text-xl font-bold focus:border-teal-500 focus:outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Email Address</label>
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-4 px-6 text-xl font-bold focus:border-teal-500 focus:outline-none transition-all"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={!name.trim() || !email.trim()}
                                className="w-full mt-4 bg-teal-600 text-white py-5 rounded-2xl text-xl font-black hover:bg-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-teal-600/20"
                            >
                                Join Quiz
                            </button>
                        </form>
                    </motion.div>
                )}

                {status === 'waiting' && (
                    <motion.div 
                        key="waiting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <Loader2 className="w-16 h-16 text-teal-500 animate-spin mx-auto mb-8" />
                        <h2 className="text-4xl font-black mb-4">Ready, {name}!</h2>
                        <p className="text-slate-400 text-xl font-medium">The quiz will start as soon as the host is ready.</p>
                    </motion.div>
                )}

                {status === 'active' && currentQuestion && (
                    <motion.div 
                        key="active"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-sm font-black text-teal-500 uppercase tracking-widest">Question {questionIndex + 1} / {quiz?.questions?.length}</span>
                            <div className="flex items-center gap-2 text-slate-400 font-bold">
                                <CheckCircle2 className="w-4 h-4 text-teal-500" /> {totalCorrect}
                            </div>
                        </div>

                        {currentQuestion.imageUrl && (
                            <div className="mb-8 rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-video flex items-center justify-center">
                                <img src={currentQuestion.imageUrl} alt="Question" className="w-full h-full object-contain" />
                            </div>
                        )}
                        <h2 className="text-3xl font-black text-center mb-10 leading-tight">
                            {currentQuestion.text}
                        </h2>
                        <div className="grid gap-4">
                            {currentQuestion.options?.map((option: string, i: number) => {
                                const isSelected = selectedAnswers.includes(i);
                                return (
                                    <button 
                                        key={i}
                                        onClick={() => handleOptionClick(i)}
                                        className={`w-full p-6 rounded-3xl border-2 transition-all text-left font-bold text-xl flex items-center gap-4 group active:scale-[0.98] ${isSelected ? 'bg-teal-600/20 border-teal-500' : 'bg-white/5 border-white/10 hover:border-teal-500'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-teal-500 text-white' : 'bg-white/10 group-hover:bg-teal-600/20 group-hover:text-teal-400'}`}>{String.fromCharCode(65+i)}</div>
                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {currentQuestion.correctAnswers.length > 1 && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => submitAnswer(selectedAnswers)}
                                disabled={selectedAnswers.length === 0}
                                className="w-full mt-8 bg-teal-600 text-white py-5 rounded-2xl text-xl font-black hover:bg-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-teal-600/20"
                            >
                                Submit Answer
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {status === 'result' && (
                    <motion.div 
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center w-full max-w-sm"
                    >
                        <div className={`p-12 rounded-[3rem] mb-8 ${isCorrect ? 'bg-teal-600/20 border-2 border-teal-500/50' : 'bg-rose-600/20 border-2 border-rose-500/50'}`}>
                            {isCorrect ? <CheckCircle2 className="w-24 h-24 text-teal-500 mx-auto mb-6" /> : <XCircle className="w-24 h-24 text-rose-500 mx-auto mb-6" />}
                            <h2 className="text-5xl font-black mb-2">{isCorrect ? 'Awesome!' : 'Oops!'}</h2>
                            <p className="text-xl font-bold text-slate-400">
                                {isCorrect ? 'Correct!' : `Correct: ${currentQuestion.correctAnswers.map((idx: number) => String.fromCharCode(65 + idx)).join(', ')}`}
                            </p>
                        </div>
                        <button 
                            onClick={handleNext}
                            className="w-full bg-white text-black py-6 rounded-3xl text-2xl font-black hover:bg-slate-200 transition-all shadow-xl active:scale-95"
                        >
                            {questionIndex < (quiz?.questions?.length || 0) - 1 ? 'Next Question' : 'Finish Quiz'}
                        </button>
                    </motion.div>
                )}

                {status === 'finished' && (
                    <motion.div 
                        key="finished"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <div className="w-32 h-32 bg-teal-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-teal-600/40">
                            <CheckCircle2 className="w-16 h-16 text-white" />
                        </div>
                        <h2 className="text-5xl font-black mb-4">Quiz Completed!</h2>
                        <p className="text-slate-400 text-xl font-medium mb-12">You've finished all questions. Check the leaderboard!</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Score</span>
                                <div className="text-4xl font-black text-teal-500">{totalCorrect} / {quiz?.questions?.length}</div>
                            </div>
                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Time</span>
                                <div className="text-4xl font-black text-white">{((Date.now() - (quizStartTime || 0)) / 1000).toFixed(1)}s</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ParticipantView;
