'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  User as UserIcon, 
  Loader2, 
  Search,
  Zap,
  Award,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface LeaderboardUser {
  user_name: string;
  total_score: number;
  sessions_count: number;
  avg_score: number;
  rank: number;
  is_current_user: boolean;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all sessions with a mastery score
      // Removed user_name as it might not exist in the schema
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('user_id, mastery_score')
        .not('mastery_score', 'is', null);

      if (error) throw error;
      if (!data) {
        setLeaderboard([]);
        return;
      }

      // Aggregate data by user
      const userStats: Record<string, { name: string; total: number; count: number; userId: string }> = {};

      data.forEach(session => {
        const userId = session.user_id;
        if (!userStats[userId]) {
          // If it's the current user, we can use their name from the auth context
          const name = userId === user?.id 
            ? (user?.user_metadata?.full_name || user?.email?.split('@')[0]) 
            : `Learner_${userId.slice(0, 5)}`;

          userStats[userId] = { 
            name: name || 'Anonymous Learner', 
            total: 0, 
            count: 0,
            userId: userId
          };
        }
        userStats[userId].total += session.mastery_score;
        userStats[userId].count += 1;
      });

      // Convert to array and sort
      const sortedUsers: LeaderboardUser[] = Object.values(userStats)
        .map(stats => ({
          user_name: stats.name,
          total_score: stats.total,
          sessions_count: stats.count,
          avg_score: Math.round(stats.total / stats.count),
          rank: 0, // Assigned below
          is_current_user: stats.userId === user?.id
        }))
        .sort((a, b) => b.total_score - a.total_score)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      setLeaderboard(sortedUsers);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      await fetchLeaderboard();
    };
    init();
  }, [fetchLeaderboard]);

  const filteredLeaderboard = leaderboard.filter(u => 
    u.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-amber-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Medal className="text-amber-700" size={24} />;
    return <span className="text-lg font-black text-gray-300">#{rank}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-gray-900 mb-2">Hall of <span className="text-indigo-600">Mastery</span></h1>
          <p className="text-gray-500 font-medium italic">Ranking the most persistent minds in the StudyGenie network.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learners..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Top 3 Podium */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {isLoading ? (
             [1, 2, 3].map((_, i) => (
               <div key={i} className="h-72 bg-gray-50 animate-pulse rounded-[2.5rem]" />
             ))
          ) : (
            leaderboard.slice(0, 3).map((topUser, i) => (
              <motion.div
                key={topUser.rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative p-8 rounded-[2.5rem] border-2 overflow-hidden shadow-xl flex flex-col items-center text-center",
                  topUser.rank === 1 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-50"
                )}
              >
                {topUser.rank === 1 && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-400" />
                )}
                
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg",
                  topUser.rank === 1 ? "bg-amber-100 text-amber-600" : 
                  topUser.rank === 2 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-600"
                )}>
                  {topUser.rank === 1 ? <Crown size={40} /> : <UserIcon size={40} />}
                </div>

                <h3 className="text-xl font-display font-black text-gray-900 mb-1">{topUser.user_name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Rank {topUser.rank}</p>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-white/50 rounded-2xl p-3 border border-white">
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Score</p>
                    <p className="text-lg font-display font-black text-indigo-600">{topUser.total_score}</p>
                  </div>
                  <div className="bg-white/50 rounded-2xl p-3 border border-white">
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Sessions</p>
                    <p className="text-lg font-display font-black text-gray-900">{topUser.sessions_count}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Full List */}
        <div className="lg:col-span-12">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Ranking</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Learner</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Score</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Growth</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Verifications</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-gray-50 last:border-none">
                        <td className="px-8 py-6"><div className="h-6 w-6 bg-gray-50 rounded mx-auto" /></td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-gray-50 rounded-xl" />
                             <div className="space-y-2">
                               <div className="h-4 w-32 bg-gray-50 rounded" />
                               <div className="h-3 w-20 bg-gray-50 rounded" />
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6"><div className="h-6 w-16 bg-gray-50 rounded" /></td>
                        <td className="px-8 py-6"><div className="h-6 w-20 bg-gray-50 rounded-full" /></td>
                        <td className="px-8 py-6 text-right"><div className="h-6 w-10 bg-gray-50 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredLeaderboard.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="py-20 text-center opacity-30">
                         <Search size={48} className="mx-auto mb-4" />
                         <p className="text-lg font-bold">No learners matching your query</p>
                       </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filteredLeaderboard.map((u, i) => (
                        <motion.tr 
                          key={u.user_name + u.rank}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none",
                            u.is_current_user && "bg-indigo-50/30"
                          )}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center w-10">
                              {getRankIcon(u.rank)}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100",
                                u.is_current_user ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"
                              )}>
                                <UserIcon size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 flex items-center gap-2">
                                  {u.user_name}
                                  {u.is_current_user && (
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-widest">You</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium">Verified Scholar</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <Zap size={14} className="text-amber-500" />
                              <span className="font-display font-black text-lg text-gray-900">{u.total_score}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                              <TrendingUp size={12} />
                              <span className="text-xs font-black">+{u.avg_score}% Avg</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 text-gray-400">
                              <Award size={14} />
                              <span className="text-sm font-bold">{u.sessions_count}</span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
