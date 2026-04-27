import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE, WS_BASE } from '../config';

interface QuizContextType {
    quizzes: any[];
    currentSession: any;
    loading: boolean;
    setQuizzes: React.Dispatch<React.SetStateAction<any[]>>;
    fetchQuizzes: () => Promise<void>;
    saveQuiz: (quiz: any) => Promise<void>;
    startLiveSession: (quizId: string) => Promise<string | null>;
    joinSession: (sessionId: string) => Promise<any>;
    deleteQuiz: (quizId: string) => Promise<void>;
    saveSessionResult: (result: any) => Promise<void>;
    connectWebSocket: (sessionId: string) => void;
    broadcastAction: (action: any) => void;
    setCurrentSession: (session: any) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [currentSession, setCurrentSession] = useState<any>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/quizzes`);
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data);
            }
        } catch (error) {
            console.error("Failed to fetch quizzes:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveQuiz = async (quiz: any) => {
        try {
            const response = await fetch(`${API_BASE}/api/quizzes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quiz)
            });
            if (response.ok) {
                await fetchQuizzes();
            }
        } catch (error) {
            console.error("Failed to save quiz:", error);
        }
    };

    const startLiveSession = async (quizId: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quiz_id: quizId })
            });
            const data = await response.json();
            setCurrentSession(data);
            connectWebSocket(data.id);
            return data.id;
        } catch (err) {
            console.error('Failed to start session:', err);
            return null;
        }
    };

    const joinSession = async (sessionId: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                setCurrentSession(data);
                connectWebSocket(sessionId);
                return data;
            }
            return null;
        } catch (err) {
            console.error('Failed to join session:', err);
            return null;
        }
    };

    const connectWebSocket = (sessionId: string) => {
        if (socket) socket.close();
        
        const wsUrl = `${WS_BASE}/ws/${sessionId}`;
        console.log("Connecting to WebSocket:", wsUrl);
        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
            console.log("WebSocket Connected for Session:", sessionId);
            setSocket(newSocket);
        };

        newSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("WebSocket Message:", data);
        };

        newSocket.onclose = () => {
            console.log("WebSocket Disconnected");
            setSocket(null);
        };
    };

    const broadcastAction = (action: any) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(action));
        } else {
            console.warn("Cannot broadcast: WebSocket not connected");
        }
    };

    const deleteQuiz = async (quizId: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/quizzes/${quizId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await fetchQuizzes();
            }
        } catch (error) {
            console.error("Failed to delete quiz:", error);
        }
    };

    const saveSessionResult = async (result: any) => {
        try {
            await fetch(`${API_BASE}/api/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });
        } catch (err) {
            console.error("Failed to save session result:", err);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    return (
        <QuizContext.Provider value={{ 
            quizzes, 
            currentSession, 
            loading, 
            setQuizzes, 
            fetchQuizzes, 
            saveQuiz,
            deleteQuiz,
            startLiveSession,
            joinSession,
            saveSessionResult,
            connectWebSocket,
            broadcastAction,
            setCurrentSession
        }}>
            {children}
        </QuizContext.Provider>
    );
};

export const useQuiz = () => {
    const context = useContext(QuizContext);
    if (!context) throw new Error('useQuiz must be used within a QuizProvider');
    return context;
};
