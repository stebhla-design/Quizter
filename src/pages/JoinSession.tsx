import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, ChevronRight, Hash } from 'lucide-react';

const JoinSession: React.FC = () => {
    const [code, setCode] = useState('');
    const navigate = useNavigate();

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Attempting to join session:", code);
        if (code.length === 6) {
            console.log("Navigating to participant view for:", code);
            navigate(`/join/${code}`);
        } else {
            console.warn("Invalid code length:", code.length);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md text-center"
            >
                <div className="flex items-center justify-center gap-3 text-2xl font-black tracking-tighter text-teal-400 mb-12">
                    <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                        <Rocket className="text-white w-6 h-6" />
                    </div>
                    QUIZTER
                </div>

                <h1 className="text-4xl font-black mb-4">Join a Quiz</h1>
                <p className="text-slate-400 mb-12 font-medium">Enter the 6-digit code shown on the host's screen to participate.</p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div className="relative">
                        <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
                        <input 
                            type="text" 
                            maxLength={6}
                            value={code}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                console.log("Code change:", val);
                                setCode(val);
                            }}
                            placeholder="Enter Code"
                            className="w-full bg-white/5 border-2 border-white/10 rounded-3xl py-6 pl-16 pr-8 text-3xl font-black placeholder:text-slate-700 focus:border-teal-500 focus:outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={code.length !== 6}
                        className="w-full bg-teal-600 text-white py-6 rounded-3xl text-xl font-black flex items-center justify-center gap-2 hover:bg-teal-500 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-teal-600/20 active:scale-[0.98]"
                    >
                        Join Session <ChevronRight className="w-6 h-6" />
                    </button>
                </form>

                <div className="mt-20">
                    <p className="text-slate-500 text-sm font-bold">Hosting a quiz? <button onClick={() => navigate('/login')} className="text-teal-500 hover:underline">Sign in to your dashboard</button></p>
                </div>
            </motion.div>
        </div>
    );
};

export default JoinSession;
