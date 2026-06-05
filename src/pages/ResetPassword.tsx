import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE } from '../config';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!token) {
            setError('Missing or invalid reset token.');
            return;
        }

        if (password.length < 4) {
            setError('Password must be at least 4 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password })
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
            } else {
                setError(data.detail || 'Failed to reset password. Token may be expired.');
            }
        } catch (err) {
            setError('Connection failed. Please check if backend is running.');
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
                            {isSuccess ? 'Password Reset!' : 'New Password'}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {isSuccess 
                                ? 'Your password has been updated successfully.' 
                                : 'Please choose a secure new password.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100 dark:border-rose-900/40">
                            {error}
                        </div>
                    )}

                    {isSuccess ? (
                        <div className="space-y-6">
                            <div className="flex justify-center text-emerald-500 mb-2 animate-bounce">
                                <CheckCircle2 className="w-16 h-16" />
                            </div>
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20"
                            >
                                Go to Sign In
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
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

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="password" 
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 font-bold transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <button 
                                disabled={isLoading || !token}
                                className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        <span>Update Password</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            
                            {!token && (
                                <p className="text-xs text-rose-500 font-bold text-center">
                                    No reset token found in URL. Please request a new link from the forgot password page.
                                </p>
                            )}

                            <Link 
                                to="/login"
                                className="w-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline text-center block"
                            >
                                Back to Sign In
                            </Link>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
