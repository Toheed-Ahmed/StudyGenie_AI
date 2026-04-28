'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Target, 
  Clock, 
  BookOpen, 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  ListTodo,
  Timer
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/lib/utils';

interface StudyPlan {
  dailyGoal: string;
  totalTime: string;
  schedule: {
    time: string;
    activity: string;
    focus: string;
    topic: string;
  }[];
  tips: string[];
}

export default function PlannerPage() {
  const [dailyGoal, setDailyGoal] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [availableTime, setAvailableTime] = useState('2'); // hours
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  const addTopic = () => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()]);
      setCurrentTopic('');
    }
  };

  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const generatePlan = async () => {
    if (!dailyGoal || topics.length === 0) return;
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const prompt = `Act as a high-performance academic coach. 
      I want to achieve this daily goal: "${dailyGoal}"
      I need to study these topics: ${topics.join(', ')}
      I have exactly ${availableTime} hours available today.
      
      Create a detailed, high-density study schedule.
      Return the plan in JSON format with exactly this structure:
      {
        "dailyGoal": "...",
        "totalTime": "...",
        "schedule": [
          { "time": "00:00 - 00:00", "activity": "...", "focus": "...", "topic": "..." }
        ],
        "tips": ["Tip 1", "Tip 2", "Tip 3"]
      }
      
      Ensure the schedule includes structured breaks (Pomodoro style) and active recall phases.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      setPlan(JSON.parse(cleanJson));
    } catch (error) {
      console.error("Plan generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2">Study <span className="text-indigo-600">Planner</span></h1>
        <p className="text-gray-500 font-medium italic">Architect your learning journey with AI-optimized schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
            <div className="space-y-6">
              {/* Daily Goal */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-indigo-600" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Daily Objective</label>
                </div>
                <input 
                  type="text"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value)}
                  placeholder="e.g. Master Neural Networks"
                  className="w-full px-4 py-3 bg-[#F8F9FB] border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Topics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-indigo-600" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Topics</label>
                </div>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text"
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    placeholder="Add topic..."
                    className="flex-1 px-4 py-3 bg-[#F8F9FB] border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                  />
                  <button 
                    onClick={addTopic}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <span key={topic} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 border border-indigo-100">
                      {topic}
                      <button onClick={() => removeTopic(topic)} className="hover:text-amber-600">
                         <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-indigo-600" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time Available (Hours)</label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '4', '8'].map(time => (
                    <button
                      key={time}
                      onClick={() => setAvailableTime(time)}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-black transition-all border",
                        availableTime === time 
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                          : "bg-[#F8F9FB] text-gray-500 border-transparent hover:border-gray-200"
                      )}
                    >
                      {time}h
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={generatePlan}
                disabled={isLoading || !dailyGoal || topics.length === 0}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Generate Architect Plan
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!plan && !isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-[3rem] opacity-60"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <ListTodo size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-display font-medium text-gray-400">No plan generated yet</h3>
                <p className="text-sm text-gray-400 mt-1 italic">Configure your session on the left to begin.</p>
              </motion.div>
            ) : isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 py-24 text-center"
              >
                <Loader2 className="animate-spin text-indigo-600 mb-6" size={48} />
                <h3 className="text-xl font-display font-bold text-gray-900">Architecting Your Study Session...</h3>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2">Optimizing cognitive load</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Plan Header */}
                {plan && (
                  <>
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Today&apos;s Blueprint</p>
                    <h2 className="text-2xl font-display font-black leading-tight truncate max-w-md">{plan.dailyGoal}</h2>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm">
                    <Timer size={20} />
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200 leading-none">Total Duration</p>
                      <p className="text-lg font-display font-black leading-tight mt-1">{plan.totalTime}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {(plan.schedule || []).map((slot, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex gap-6"
                    >
                      <div className="w-24 shrink-0 py-4 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{slot.time}</span>
                        <div className="w-px h-full bg-gray-100 group-last:hidden mt-2 mr-3" />
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black uppercase text-indigo-500 tracking-widest mb-1">{slot.topic}</p>
                          <h4 className="text-base font-display font-bold text-gray-900 mb-1">{slot.activity}</h4>
                          <p className="text-xs text-gray-500 font-medium italic">Focus: {slot.focus}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Cognitive Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(plan.tips || []).map((tip, i) => (
                    <div key={i} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-start gap-3">
                      <div className="mt-1">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-600 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
