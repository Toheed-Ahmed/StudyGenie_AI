'use client';

import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Award, 
  Zap, 
  Brain, 
  CheckCircle2, 
  ShieldCheck,
  Star,
  Trophy,
  Loader2,
  Share2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ProfileData {
  masteredTopics: any[];
  totalScore: number;
  skills: string[];
  badges: any[];
  joinDate: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData>({
    masteredTopics: [],
    totalScore: 0,
    skills: [],
    badges: [],
    joinDate: ''
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        // Fetch Mastered Sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('tutor_sessions')
          .select('*')
          .eq('is_mastered', true)
          .order('created_at', { ascending: false });

        // Fetch Memory/Skills
        const { data: memory, error: memoryError } = await supabase
          .from('user_memories')
          .select('*')
          .single();

        if (sessionError) throw sessionError;

        const totalScore = sessions?.reduce((acc, s) => acc + (s.mastery_score || 0), 0) || 0;
        const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Logic-based Badges
        const badges = [];
        if (sessions && sessions.length >= 1) badges.push({ name: 'First Logic Break', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' });
        if (sessions && sessions.length >= 5) badges.push({ name: 'Socratic Thinker', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50' });
        if (totalScore >= 500) badges.push({ name: 'Knowledge Architect', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' });

        setData({
          masteredTopics: sessions || [],
          totalScore,
          skills: memory?.strong_topics || [],
          badges,
          joinDate
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0];

  return (
    <div className="py-2 sm:py-6 max-w-5xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8">
           <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-indigo-600 transition-colors">
             <Share2 size={20} />
           </button>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-indigo-600 border-8 border-white shadow-xl">
              {displayName?.[0]?.toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 border-4 border-white rounded-2xl flex items-center justify-center text-white shadow-lg">
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 justify-center md:justify-start">
              <h1 className="text-4xl font-display font-black text-gray-900 leading-none">{displayName}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest self-center md:self-auto">
                Verified Expert
              </span>
            </div>
            
            <p className="text-gray-500 font-medium mb-6 max-w-xl">
              Knowledge architect exploring the intersections of logical reasoning and autonomous learning. Specializing in inquiry-based mental models.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-bold text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-600" />
                Digital Intelligence Lab
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" />
                Joined {data.joinDate}
              </div>
              <div className="flex items-center gap-2">
                <LinkIcon size={16} className="text-indigo-600" />
                studygenie.ai/{user?.id?.slice(0, 8)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Skills */}
        <div className="space-y-8">
          {/* Learning Score Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-indigo-100"
          >
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Learning Score</p>
              <h3 className="text-6xl font-display font-black mb-1">{data.totalScore}</h3>
              <p className="text-sm font-bold opacity-80">Top 4% of active learners</p>
            </div>
          </motion.div>

          {/* Verified Skills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm"
          >
            <h3 className="font-display font-bold text-gray-900 mb-6 flex items-center justify-between">
              Core Skills
              <Brain size={18} className="text-indigo-500" />
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.length > 0 ? data.skills.map((skill, i) => (
                <span 
                  key={i} 
                  className="px-4 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-100/50 hover:border-indigo-200 hover:bg-white transition-all cursor-default"
                >
                  {skill}
                </span>
              )) : (
                <p className="text-xs text-gray-400 italic">No verified skills yet. Start a tutoring session!</p>
              )}
            </div>
          </motion.div>

          {/* Achievement Badges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm"
          >
            <h3 className="font-display font-bold text-gray-900 mb-6 flex items-center justify-between">
              Achievements
              <Star size={18} className="text-amber-500" />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {data.badges.map((badge, i) => (
                <div key={i} className={cn("p-4 rounded-2xl flex flex-col items-center text-center gap-2 border-2 border-transparent transition-all hover:scale-105", badge.bg)}>
                  <badge.icon size={24} className={badge.color} />
                  <span className="text-[10px] font-black uppercase text-gray-900 leading-tight">{badge.name}</span>
                </div>
              ))}
              {data.badges.length === 0 && (
                <p className="col-span-2 text-xs text-gray-400 italic text-center py-4">Earn badges by mastering topics.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Mastered Topics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between px-4">
            <h3 className="font-display font-bold text-gray-900 text-xl">Verified Mastery Map</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
               <CheckCircle2 size={16} />
               {data.masteredTopics.length} Concepts Unlocked
            </div>
          </div>

          <div className="grid gap-4">
            {data.masteredTopics.length > 0 ? data.masteredTopics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (i * 0.1) }}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow cursor-default"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#F8F9FB] rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                    <Award size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-display font-bold text-gray-900 mb-1">{topic.title}</h4>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                       <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                       <span className="text-gray-200">|</span>
                       <span className="text-indigo-600">Score: {topic.mastery_score}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                   <div className="flex gap-1 mb-2">
                     {[1,2,3,4,5].map(star => (
                       <Star key={star} size={12} className={cn(star <= 4 ? "text-amber-400 fill-amber-400" : "text-gray-100")} />
                     ))}
                   </div>
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Verified Logic</span>
                </div>
              </motion.div>
            )) : (
              <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center opacity-50">
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No mastered concepts yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
