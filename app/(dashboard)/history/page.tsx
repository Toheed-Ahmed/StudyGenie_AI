'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Search, 
  ChevronRight, 
  Loader2, 
  Calendar, 
  Award, 
  Trash2,
  X,
  User as UserIcon,
  Bot,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
  is_mastered?: boolean;
  mastery_score?: number;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('id, title, created_at, is_mastered, mastery_score')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSessions((data || []) as Session[]);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSessionDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('messages')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data?.messages || [];
    } catch (error) {
      console.error("Error fetching session details:", error);
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchHistory();
    };
    init();
  }, [fetchHistory]);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Permanently delete this learning record?")) return;
    try {
      const { error } = await supabase
        .from('tutor_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setSessions(sessions.filter(s => s.id !== id));
      if (selectedSession?.id === id) setSelectedSession(null);
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2">Learning <span className="text-indigo-600">History</span></h1>
        <p className="text-gray-500 font-medium italic">Trace your intellectual evolution through Socratic records.</p>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
        {/* Sessions List */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {isLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-24 bg-gray-50 animate-pulse rounded-2xl border border-gray-50 mb-3" />
              ))
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-20 opacity-30 italic">
                <p className="text-sm font-medium">No learning dialogues found.</p>
              </div>
            ) : (
              filteredSessions.map(session => (
                <div
                  key={session.id}
                  onClick={async () => {
                    setSelectedSession(session);
                    const messages = await fetchSessionDetails(session.id);
                    setSelectedSession({ ...session, messages });
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSession(session);
                      const messages = await fetchSessionDetails(session.id);
                      setSelectedSession({ ...session, messages });
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "w-full p-5 text-left rounded-2xl transition-all border group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    selectedSession?.id === session.id 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "bg-white border-gray-50 hover:border-indigo-100 text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar size={14} className={selectedSession?.id === session.id ? "text-indigo-200" : "text-indigo-500"} />
                    <span className={cn("text-[8px] font-black uppercase tracking-widest", selectedSession?.id === session.id ? "text-indigo-200" : "text-gray-400")}>
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                    {session.is_mastered && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1",
                        selectedSession?.id === session.id ? "bg-white/20 text-white" : "bg-green-100 text-green-600"
                      )}>
                        <Award size={8} /> Mastered
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold leading-snug line-clamp-1 pr-6">{session.title}</h3>
                  <div className="mt-2 flex items-center gap-3 opacity-60">
                    <div className="flex items-center gap-1">
                      <MessageSquare size={10} />
                      <span className="text-[10px] font-bold">{session.messages?.length || 0} msgs</span>
                    </div>
                  </div>
                  
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      onClick={(e) => deleteSession(session.id, e)}
                      className={cn(
                        "p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                        selectedSession?.id === session.id ? "hover:bg-white/20 text-white" : "hover:bg-rose-50 text-gray-300 hover:text-rose-600"
                      )}
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={14} className={cn(
                      "transition-all opacity-0 group-hover:opacity-100",
                      selectedSession?.id === session.id && "opacity-100"
                    )} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dialogue Details */}
        <div className="hidden lg:flex flex-1 bg-white border border-gray-100 rounded-[3rem] shadow-sm flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {selectedSession ? (
              <motion.div 
                key={selectedSession.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <History size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-black text-gray-900">{selectedSession.title}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(selectedSession.created_at).toLocaleString()}
                        </span>
                        {selectedSession.mastery_score !== undefined && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                            Proficiency: {selectedSession.mastery_score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedSession(null)}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                  {(selectedSession.messages || []).map((msg, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "flex gap-4 max-w-3xl",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        msg.role === 'user' ? "bg-white border border-gray-100 text-indigo-600" : "bg-indigo-600 text-white"
                      )}>
                        {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={cn(
                        "p-5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"
                      )}>
                        <div className="prose prose-sm prose-p:leading-relaxed prose-headings:font-display prose-headings:font-black">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                  <History size={48} className="text-gray-400" />
                </div>
                <p className="text-xl font-display font-bold text-gray-900">Select a dialogue archive</p>
                <p className="text-sm font-medium mt-2">Retroactively explore your Socratic learning sessions.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden bg-white flex flex-col"
          >
            <div className="p-6 border-b border-gray-50 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <History size={18} />
                  </div>
                  <h2 className="font-display font-bold text-gray-900 truncate max-w-[200px]">{selectedSession.title}</h2>
               </div>
               <button onClick={() => setSelectedSession(null)} className="p-2 text-gray-400">
                 <X size={24} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(selectedSession.messages || []).map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1",
                    msg.role === 'user' ? "bg-indigo-50 text-indigo-600" : "bg-indigo-600 text-white"
                  )}>
                    {msg.role === 'user' ? <UserIcon size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-xs font-bold leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-gray-100 text-gray-900 rounded-tl-none"
                  )}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
