import React from 'react';
import { BarChart2, Users, Target, Clock, ArrowLeft, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Reports: React.FC = () => {
    const navigate = useNavigate();
    const [reports, setReports] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/results');
                if (response.ok) {
                    const data = await response.json();
                    setReports(data);
                }
            } catch (err) {
                console.error("Failed to fetch reports:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-12">
            <header className="max-w-6xl mx-auto mb-12">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold mb-6 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Performance Reports</h1>
                        <p className="text-slate-500 font-medium">Analyze engagement and accuracy across all your live sessions.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn btn-secondary gap-2"><Filter className="w-4 h-4" /> Filter</button>
                        <button className="btn btn-primary gap-2"><Download className="w-4 h-4" /> Export All</button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                {/* Overview Cards */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                    <ReportStat icon={<Users />} label="Total Participants" value="139" color="teal" />
                    <ReportStat icon={<Target />} label="Average Accuracy" value="78.5%" color="blue" />
                    <ReportStat icon={<Clock />} label="Time per Question" value="14.2s" color="purple" />
                </div>

                {/* Reports Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold">Recent Sessions</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                <th className="px-8 py-5">Quiz Title</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Participants</th>
                                <th className="px-8 py-5">Accuracy</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                                        No session reports found yet. Host a live quiz to see results!
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report, i) => (
                                    <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <td className="px-8 py-6 font-bold">{report.quiz_id}</td>
                                        <td className="px-8 py-6 text-slate-400 font-medium">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{report.participants_count}</span>
                                                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, report.participants_count * 10)}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg text-sm font-black">
                                                {report.avg_score}%
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-slate-400 hover:text-teal-600 font-bold text-sm">View Details</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

const ReportStat = ({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => {
    const colors: any = {
        teal: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${colors[color]}`}>
                {React.cloneElement(icon, { className: 'w-6 h-6' })}
            </div>
            <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">{label}</span>
                <div className="text-3xl font-black">{value}</div>
            </div>
        </div>
    );
};

export default Reports;
