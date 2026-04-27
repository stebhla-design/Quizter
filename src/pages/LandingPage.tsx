import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Trophy, BarChart, Rocket, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tighter text-teal-600 dark:text-teal-400">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                            <Rocket className="text-white w-5 h-5" />
                        </div>
                        QUIZTER
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="text-sm font-semibold hover:text-teal-600 transition-colors">Dashboard</Link>
                        <Link to="/login" className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-95">Sign In</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative py-24 md:py-40 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
                            Engage your audience <br/>
                            <span className="text-teal-600 dark:text-teal-400">live and in real-time.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12">
                            The world's most intuitive platform for live quizzes, polls, and knowledge checks. 
                            Built for teachers, trainers, and high-performance teams.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                            <Link to="/dashboard" className="bg-teal-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/30 flex items-center gap-2 group">
                                Create Your First Quiz
                                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/join" className="bg-slate-200 dark:bg-slate-800 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">
                                Join a Session
                            </Link>
                        </div>
                    </motion.div>
                </div>
                
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500 rounded-full blur-[128px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]" />
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<Zap className="text-teal-600" />} 
                            title="Live Sessions" 
                            description="Launch interactive sessions with real-time participation and dynamic join codes."
                        />
                        <FeatureCard 
                            icon={<Trophy className="text-teal-600" />} 
                            title="Instant Leaderboards" 
                            description="Keep engagement high with automated scoreboards and fast-answer bonuses."
                        />
                        <FeatureCard 
                            icon={<BarChart className="text-teal-600" />} 
                            title="Deep Analytics" 
                            description="Track progress and identify knowledge gaps with detailed post-session reports."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
                <p>© 2026 Quizter. Built for high-performance engagement.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-teal-500 transition-all hover:translate-y-[-4px]">
        <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
            {icon}
        </div>
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
);

export default LandingPage;
