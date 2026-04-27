import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import QuizBuilder from './pages/QuizBuilder';
import LiveHost from './pages/LiveHost';
import ParticipantView from './pages/ParticipantView';
import Reports from './pages/Reports';
import Auth from './pages/Auth';
import JoinSession from './pages/JoinSession';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = !!localStorage.getItem('token');
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
    return (
        <QuizProvider>
            <Router>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/builder/:id" element={<PrivateRoute><QuizBuilder /></PrivateRoute>} />
                        <Route path="/host/:sessionId" element={<PrivateRoute><LiveHost /></PrivateRoute>} />
                        <Route path="/join/:sessionId" element={<ParticipantView />} />
                        <Route path="/join" element={<JoinSession />} />
                        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                        <Route path="/login" element={<Auth mode="login" />} />
                        <Route path="/signup" element={<Auth mode="signup" />} />
                    </Routes>
                </div>
            </Router>
        </QuizProvider>
    );
};

export default App;
