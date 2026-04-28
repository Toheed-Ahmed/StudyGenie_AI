'use client';

import { motion } from 'motion/react';
import { 
  Flame, 
  Target, 
  Zap, 
  Brain, 
  TrendingUp, 
  Award, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  Cell,
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import charts to improve initial page load speed
const DynamicAreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const DynamicBarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const DynamicResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streak: 0,
    mastered: 0,
    totalScore: 0,
    avgMastery: 0
  });
  const [progressData, setProgressData] = useState<any[]>([]);
  const [topicMastery, setTopicMastery] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('tutor_sessions')
          .select('created_at, is_mastered, mastery_score, title')
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (!sessions) return;

        // Process Stats
        const mastered = sessions.filter(s => s.is_mastered).length;
        const totalScore = sessions.reduce((acc, s) => acc + (s.mastery_score || 0), 0);
        const avgMastery = sessions.length > 0 ? Math.round(totalScore / sessions.length) : 0;

        setStats({
          streak: mastered > 0 ? 3 : 0, // Mocking streak logic for now, but linked to mastery
          mastered,
          totalScore,
          avgMastery
        });

        // Process Chart Data (Last 7 Sessions)
        const chartData = sessions.slice(-7).map(s => ({
          name: new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
          score: s.mastery_score || 0
        }));
        setProgressData(chartData);

        // Process Topic Mastery
        const topics = sessions.map(s => ({
          topic: s.title,
          value: s.mastery_score || 0,
          color: s.is_mastered ? '#10B981' : '#4F46E5'
        })).slice(-4);
        setTopicMastery(topics);

        // Process Weak Areas
        const weak = sessions
          .filter(s => (s.mastery_score || 0) < 70 && !s.is_mastered)
          .map(s => ({
            topic: s.title,
            issue: 'Conceptual gaps identified',
            icon: AlertCircle,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
          }))
          .slice(0, 2);
        setWeakAreas(weak.length > 0 ? weak : [
          { topic: 'Quantum Basics', issue: 'Inquiry Session Required', icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' }
        ]);

      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-display font-black text-slate-900 tracking-tight">
            Learning Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Tracking your journey to cognitive mastery.
          </p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sync Active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Learning Streak', value: loading ? "..." : `${stats.streak} Days`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Concepts Mastered', value: loading ? "..." : stats.mastered.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Mastery Score', value: loading ? "..." : stats.totalScore.toString(), icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Avg. Mastery', value: loading ? "..." : `${stats.avgMastery}%`, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "bg-white p-5 lg:p-6 rounded-3xl border shadow-sm group hover:shadow-md transition-all duration-200",
              stat.border
            )}
          >
            <div className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              {loading ? (
                <div className="h-8 w-20 bg-slate-50 animate-pulse rounded-lg" />
              ) : (
                <p className="text-2xl lg:text-3xl font-display font-black text-slate-900">{stat.value}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 bg-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Mastery Growth</h3>
                <p className="text-xs text-slate-500 font-medium">Daily average cognitive score</p>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="relative h-[250px] lg:h-[300px] w-full mt-4">
            {isMounted && !loading ? (
              <DynamicResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <DynamicAreaChart data={progressData.length > 0 ? progressData : [{name: 'Empty', score: 0}]}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 800,
                      backgroundColor: '#fff'
                    }}
                    cursor={{ stroke: '#4F46E5', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4F46E5" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorScore)"
                    animationDuration={1500}
                  />
                </DynamicAreaChart>
              </DynamicResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-50 animate-pulse rounded-3xl flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-200" size={24} />
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Sidebar */}
        <div className="space-y-6 lg:space-y-8">
          {/* Focus Areas Card */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 lg:p-8 rounded-[2rem] border shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                Focus Areas
              </h3>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-tighter rounded-full border border-rose-100">
                Priority
              </span>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2].map(i => (
                  <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl w-full" />
                ))
              ) : (
                weakAreas.map((area, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ x: 4 }}
                    className="p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-xl shrink-0 transition-all group-hover:shadow-md", area.bg, area.color)}>
                        <area.icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{area.topic}</p>
                        <p className="text-xs text-slate-500 font-medium">{area.issue}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95">
              <Brain size={18} />
              Review Concepts
            </button>
          </motion.div>

          {/* Quick Stats Mini */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-600 p-6 lg:p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden"
          >
            <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500 opacity-20 rotate-12" />
            <div className="relative z-10">
              <h4 className="font-bold text-blue-100 text-sm mb-1 uppercase tracking-widest">Global Rank</h4>
              <p className="text-3xl font-black font-display tracking-tight">Top 12%</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1 flex-1 bg-blue-500/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '88%' }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
                <span className="text-[10px] font-black uppercase">Elite</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Topic Mastery Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="xl:col-span-1 bg-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold text-slate-900">Topic Mastery</h3>
            <Target size={18} className="text-slate-400" />
          </div>

          <div className="space-y-6">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-3 bg-slate-50 animate-pulse rounded w-1/3" />
                    <div className="h-3 bg-slate-50 animate-pulse rounded w-10" />
                  </div>
                  <div className="h-2 bg-slate-50 animate-pulse rounded-full" />
                </div>
              ))
            ) : (
              topicMastery.map((topic, i) => (
                <div key={topic.topic} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider group-hover:text-slate-900 transition-colors">{topic.topic}</span>
                    <span className="text-xs font-black text-slate-900 font-mono">{topic.value}%</span>
                  </div>
                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden border p-0.5 border-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.value}%` }}
                      transition={{ delay: 0.8 + (i * 0.1), duration: 1 }}
                      className="h-full rounded-full shadow-inner"
                      style={{ backgroundColor: topic.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Detailed Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="xl:col-span-2 bg-[#F8F9FB] p-1 rounded-[2.5rem] border group"
        >
          <div className="bg-white m-1 p-6 lg:p-8 rounded-[2.2rem] shadow-sm h-full group-hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-slate-900">Session Mastery Variance</h3>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <div className="w-1 h-1 rounded-full bg-slate-200" />
              </div>
            </div>
            
            <div className="relative h-[240px] w-full">
              {isMounted && !loading ? (
                <DynamicResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <DynamicBarChart data={topicMastery} layout="vertical" barSize={32}>
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis 
                      dataKey="topic" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                      width={100} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }} 
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                      {topicMastery.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </DynamicBarChart>
                </DynamicResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-3xl flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-200" size={24} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
