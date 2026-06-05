import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../config';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';

const Auth: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isResetSent, setIsResetSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            if (isForgotPassword) {
                const response = await fetch(`${API_BASE}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    setIsResetSent(true);
                } else {
                    setError(data.detail || 'Failed to send reset link');
                }
                return;
            }

            const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (mode === 'login') {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userEmail', data.email);
                    navigate('/dashboard');
                } else {
                    // After signup, go to login
                    navigate('/login');
                }
            } else {
                setError(data.detail || 'Authentication failed');
            }
        } catch (err) {
            setError('Connection failed. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full -z-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[150px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 md:p-12">
                    <div className="text-center mb-10">
                        <Logo 
                            showText={false}
                            className="flex justify-center mb-6"
                            iconClassName="w-16 h-16 text-teal-600 dark:text-teal-400 drop-shadow-md" 
                        />
                        <h1 className="text-3xl font-black tracking-tight mb-2">
                            {isForgotPassword 
                                ? (isResetSent ? 'Link Sent!' : 'Reset Password') 
                                : (mode === 'login' ? 'Welcome Back' : 'Create Account')}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {isForgotPassword 
                                ? (isResetSent ? `We have sent a reset link to your email.` : 'Enter your email to receive a password reset link.') 
                                : (mode === 'login' ? 'Continue your engagement journey.' : 'Start hosting interactive live sessions today.')}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100 dark:border-rose-900/40">
                            {error}
                        </div>
                    )}

                    {isForgotPassword && isResetSent ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 dark:border-emerald-900/40 text-center leading-relaxed">
                                A password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password.
                            </div>
                            <button 
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setIsResetSent(false);
                                    setEmail('');
                                }}
                                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all outline-none"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 font-bold transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {!isForgotPassword && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
                                        {mode === 'login' && (
                                            <button 
                                                type="button"
                                                onClick={() => setIsForgotPassword(true)}
                                                className="text-xs font-black text-teal-600 hover:underline cursor-pointer"
                                            >
                                                Forgot Password?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input 
                                            type="password" 
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 font-bold transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                disabled={isLoading}
                                className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        <span>{isForgotPassword ? 'Send Reset Link' : (mode === 'login' ? 'Sign In' : 'Get Started')}</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {isForgotPassword && (
                                <button
                                    type="button"
                                    onClick={() => setIsForgotPassword(false)}
                                    className="w-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline text-center block"
                                >
                                    Back to Sign In
                                </button>
                            )}
                        </form>
                    )}

                    {!isForgotPassword && (
                        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-slate-500 font-medium">
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                                <Link 
                                    to={mode === 'login' ? '/signup' : '/login'} 
                                    className="text-teal-600 font-black ml-2 hover:underline"
                                >
                                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const SocialButton = ({ icon, label }: { icon: any, label: string }) => (
    <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-sm">
        {icon} {label}
    </button>
);

export default Auth;
