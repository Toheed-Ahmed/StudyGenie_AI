'use client';

import { motion } from 'motion/react';
import { Award, FileText, Search, Filter, Loader2, Star, ShieldCheck, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import CertificateModal from '@/components/CertificateModal';

export default function CertificatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchCertificates = async () => {
      try {
        const { data, error } = await supabase
          .from('tutor_sessions')
          .select('*')
          .eq('is_mastered', true)
          .order('created_at', { ascending: false });
        if (error) {
          if (error.code === '42703') {
            setSessions([]);
          } else {
            throw error;
          }
        }
        setSessions(data || []);
      } catch (err) {
        console.error("Certificates fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  return (
    <div className="py-2 sm:py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 mb-2">Academic Portfolio</h1>
          <p className="text-gray-500 font-medium tracking-tight">Your verified proofs of mastery and logical reasoning.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm self-start">
          <Award size={18} className="text-indigo-600" />
          <span className="text-sm font-bold text-gray-700">{loading ? '...' : sessions.length} Verified Records</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-50 animate-pulse rounded-[2.5rem]" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 p-16 rounded-[3rem] flex flex-col items-center justify-center text-center shadow-sm"
        >
          <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-[2rem] flex items-center justify-center mb-6">
            <Award size={48} />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">No Verified Records</h2>
          <p className="text-gray-500 font-medium max-w-sm mb-8 italic">
            Master complex concepts in the AI Tutor to unlock your verified digital portfolio.
          </p>
          <button 
            onClick={() => window.location.href = '/tutor'}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Start Learning Now
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              onClick={() => setSelectedSession(session)}
            >
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-bl-[2.5rem] flex items-center justify-center text-indigo-400 opacity-40">
                <FileText size={20} />
              </div>

              <div className="mb-6">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 mb-4 group-hover:rotate-12 transition-transform">
                  <Award size={24} />
                </div>
                <h3 className="text-xl font-display font-black text-gray-900 leading-tight mb-2 truncate pr-6">{session.title}</h3>
                <div className="flex items-center gap-3 mb-4">
                   <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                     Issued: {new Date(session.created_at).toLocaleDateString()}
                   </p>
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                     Score: {session.mastery_score || 0}%
                   </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                   <span className="px-2 py-0.5 bg-gray-50 text-[8px] font-bold text-gray-400 rounded-md border border-gray-100 uppercase tracking-tighter">
                     {session.title.slice(0, 20)}{session.title.length > 20 ? '...' : ''}
                   </span>
                   <span className="px-2 py-0.5 bg-gray-50 text-[8px] font-bold text-gray-400 rounded-md border border-gray-100 uppercase tracking-tighter">
                     Logic
                   </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2">
                   <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} className="text-amber-400 fill-amber-400" />)}
                   </div>
                   <span className="text-[10px] font-bold text-gray-400">Expert</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Download size={14} />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    <ShieldCheck size={12} />
                    Verified
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
            </motion.div>
          ))}
        </div>
      )}

      {selectedSession && (
        <CertificateModal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          data={{
            userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student',
            topic: selectedSession.title,
            score: selectedSession.mastery_score || 0,
            date: new Date(selectedSession.created_at).toLocaleDateString(),
            id: selectedSession.id
          }}
        />
      )}
    </div>
  );
}
