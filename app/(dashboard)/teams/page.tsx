'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  ArrowRight, 
  Shield, 
  Zap, 
  Trophy, 
  Target, 
  User as UserIcon, 
  Loader2, 
  X,
  ChevronRight,
  TrendingUp,
  Award,
  Crown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  member_count: number;
  total_points: number;
  avg_mastery: number;
}

interface TeamMember {
  user_id: string;
  user_name: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const fetchTeamsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch my team membership
      if (user) {
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', memberData.team_id)
            .single();
          
          if (teamData) {
            setMyTeam(teamData);
            
            // Fetch members
            const { data: members, error: membersError } = await supabase
              .from('team_members')
              .select('user_id, user_name, role, joined_at')
              .eq('team_id', teamData.id);
            
            if (members) {
              setTeamMembers(members as TeamMember[]);
            }
          }
        }
      }

      // 2. Fetch all teams for leaderboard/browse
      const { data: allTeams, error: allTeamsError } = await supabase
        .from('teams')
        .select('*')
        .order('total_points', { ascending: false });

      if (allTeams) {
        setTeams(allTeams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTeamsData();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchTeamsData]);

  const createTeam = async () => {
    if (!newTeamName.trim() || !user) return;
    setIsCreating(true);
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName,
          description: newTeamDesc,
          created_by: user.id,
          member_count: 1,
          total_points: 0,
          avg_mastery: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Add self as admin
      await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Explorer',
          role: 'admin'
        });

      setIsCreateModalOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
      fetchTeamsData();
    } catch (error) {
      console.error("Error creating team:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Learner',
          role: 'member'
        });

      if (error) throw error;

      // Update team member count (simplified for this applet)
      const clickedTeam = teams.find(t => t.id === teamId);
      if (clickedTeam) {
        await supabase
          .from('teams')
          .update({ member_count: clickedTeam.member_count + 1 })
          .eq('id', teamId);
      }

      fetchTeamsData();
    } catch (error) {
      console.error("Error joining team:", error);
    }
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-gray-900 mb-2">Study <span className="text-indigo-600">Squads</span></h1>
          <p className="text-gray-500 font-medium italic">Master complex concepts together. Aggregate points, conquer leaderboards.</p>
        </div>
        
        {!myTeam && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus size={18} />
            Form a Squad
          </button>
        )}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-display font-black text-gray-900">Found a New Squad</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">Recruit fellow persistent minds.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Squad Name</label>
                  <input 
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Quantum Seekers"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Manifesto (Short Description)</label>
                  <textarea 
                    rows={3}
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    placeholder="Our collective goal is to master..."
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-medium transition-all resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={createTeam}
                  disabled={!newTeamName.trim() || isCreating}
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Ignite Squad"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Squad View / Browse */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {myTeam ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-[3rem] p-8 sm:p-12 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                    <Users size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-black text-gray-900">{myTeam.name}</h2>
                    <p className="text-gray-500 font-medium">{myTeam.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                   <Shield size={16} className="text-indigo-600" />
                   <span className="text-xs font-black uppercase tracking-widest text-gray-400">Locked Squad</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-12">
                   {[
                     { label: 'Mastery Pts', value: myTeam.total_points, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                     { label: 'Squad Rank', value: `#${teams.findIndex(t => t.id === myTeam.id) + 1}`, icon: Trophy, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                     { label: 'Avg Mastery', value: `${myTeam.avg_mastery}%`, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                     { label: 'Active Minds', value: teamMembers.length, icon: Users, color: 'text-rose-500', bg: 'bg-rose-50' }
                   ].map((stat, i) => (
                     <div key={i} className="p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm flex flex-col items-center">
                        <div className={cn("p-3 rounded-2xl mb-4", stat.bg, stat.color)}>
                          <stat.icon size={20} />
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-xl font-display font-black text-gray-900">{stat.value}</p>
                     </div>
                   ))}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Squad Members</h3>
                  <TrendingUp size={14} className="text-emerald-500" />
                </div>
                <div className="space-y-3">
                  {teamMembers.map((member, i) => (
                    <motion.div 
                      key={member.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-4 bg-[#F8F9FB] rounded-2xl border border-transparent hover:border-indigo-100 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
                          {member.role === 'admin' ? <Shield size={18} className="text-indigo-600" /> : <UserIcon size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.user_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">{member.role} • Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">Active</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm flex flex-col">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-display font-black text-gray-900">Browse Squads</h2>
                <div className="relative w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search groups..."
                     className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl outline-none text-xs font-bold transition-all"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTeams.map((team, i) => (
                  <motion.div 
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-6 bg-[#F8F9FB] rounded-[2.5rem] border border-transparent hover:border-indigo-200 transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                          <Users size={24} />
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-600">
                          <Zap size={14} />
                          <span className="text-[10px] font-black tracking-widest uppercase">{team.total_points}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-display font-black text-gray-900 mb-1">{team.name}</h3>
                      <p className="text-xs text-gray-500 font-medium mb-6 line-clamp-2">{team.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(j => (
                            <div key={j} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 overflow-hidden">
                              <UserIcon size={12} />
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{team.member_count} Members</span>
                      </div>
                      <button 
                        onClick={() => joinTeam(team.id)}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-indigo-100"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Squad Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Squad Leaders</h2>
              <Trophy size={16} className="text-amber-500" />
            </div>
            
            <div className="space-y-6">
               {teams.slice(0, 5).map((team, i) => (
                 <div key={team.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-sm transition-all",
                         i === 0 ? "bg-amber-100 text-amber-600 scale-110" : 
                         i === 1 ? "bg-gray-100 text-gray-500" :
                         i === 2 ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-300"
                       )}>
                          {i === 0 ? <Crown size={18} /> : i + 1}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{team.name}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{team.member_count} Members</span>
                             <span className="w-1 h-1 bg-gray-200 rounded-full" />
                             <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">{team.avg_mastery}% Avg</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-display font-black text-gray-900">{team.total_points}</p>
                       <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Pts</p>
                    </div>
                 </div>
               ))}
            </div>

            <button className="w-full mt-10 py-4 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-dashed border-gray-200">
               View Global Standings
            </button>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-indigo-100">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
               <Award size={100} />
            </div>
            <div className="relative z-10">
               <h3 className="text-lg font-display font-black mb-4 flex items-center gap-3">
                 <Zap size={20} className="text-amber-400" />
                 Squad Boost
               </h3>
               <p className="text-xs font-medium text-indigo-100 leading-relaxed mb-6">
                 Learning in pairs increases logical retention by 40%. Join a squad to unlock collaborative challenges and shared certificates.
               </p>
               <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                 Learn More
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
