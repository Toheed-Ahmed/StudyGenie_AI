'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Volume2, 
  Moon, 
  Save,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'ai' | 'security'>('profile');
  const [isSaved, setIsSaved] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'ai', label: 'AI Tutor', icon: Volume2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const;

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2">Account <span className="text-indigo-600">Settings</span></h1>
        <p className="text-gray-500 font-medium">Configure your StudyGenie environment and personal identity.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-gray-500 hover:bg-white hover:text-gray-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-8 sm:p-12">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center border-4 border-white shadow-xl">
                  <User size={40} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{user?.user_metadata?.full_name || 'Student'}</h3>
                  <p className="text-sm font-medium text-gray-400">{user?.email}</p>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Display Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.user_metadata?.full_name}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    disabled
                    value={user?.email || ''}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent outline-none font-bold text-gray-300 cursor-not-allowed"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <Volume2 className="text-indigo-600" />
                    <div>
                      <h4 className="font-bold text-gray-900">Voice Synthesis</h4>
                      <p className="text-xs text-gray-400 font-medium">Enable AI spoken responses by default</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <Moon className="text-indigo-600" />
                    <div>
                      <h4 className="font-bold text-gray-900">Concept Deep-Dive</h4>
                      <p className="text-xs text-gray-400 font-medium">AI will push harder on weak topics</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="opacity-40 italic text-center py-12">
               <Bell size={24} className="mx-auto mb-4" />
               <p className="text-sm font-medium">Notification preferences coming soon.</p>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               <button className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                  <div className="flex items-center gap-4">
                    <Lock className="text-gray-400 group-hover:text-indigo-600" />
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900">Change Password</h4>
                      <p className="text-xs text-gray-400 font-medium">Update your account credentials</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-indigo-600" />
               </button>
            </motion.div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-50 flex justify-end">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 size={18} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
