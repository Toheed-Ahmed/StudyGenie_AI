'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Loader2, Timer, AlertCircle, CheckCircle2, ChevronRight, Award, Trophy, RefreshCcw, FileText } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function ExamPage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [examStarted, setExamStarted] = useState(false);
  const [examComplete, setExamComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [score, setScore] = useState(0);

  const startExam = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setQuestions([]);
    setUserAnswers({});
    setExamStarted(false);
    setExamComplete(false);
    setScore(0);
    setTimeLeft(600);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const prompt = `Generate a formal academic exam about "${topic}".
      Return exactly 10 high-difficulty Multiple Choice Questions in JSON format.
      Be extremely concise. No extra keys. No markdown outside JSON.
      Each question must have:
      - question
      - options: array of 4
      - correctAnswer: 0-3
      - explanation: rigorous justification.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      setQuestions(data.questions.map((q: any, i: number) => ({ ...q, id: i })));
      setExamStarted(true);
    } catch (error) {
      console.error("Exam generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitExam = useCallback(() => {
    let finalScore = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correctAnswer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setExamComplete(true);
    setExamStarted(false);
  }, [questions, userAnswers]);

  useEffect(() => {
    if (!examStarted) return;

    if (timeLeft <= 0) {
      const timeout = setTimeout(() => submitExam(), 0);
      return () => clearTimeout(timeout);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft, submitExam]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (qIndex: number, aIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [qIndex]: aIndex }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2">AI Exam <span className="text-rose-600">Mode</span></h1>
        <p className="text-gray-500 font-medium italic">Timed, high-stakes knowledge assessment with zero guidance.</p>
      </div>

      {!examStarted && !examComplete && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm text-center"
        >
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <FileText size={40} />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Enter Exam Topic</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">This mode features a 10-minute timer and 10 complex questions. No hints are provided during the test.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Astrophysics, Microeconomics..."
              className="flex-1 px-6 py-4 bg-[#F8F9FB] border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && startExam()}
            />
            <button 
              onClick={startExam}
              disabled={!topic.trim()}
              className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Timer size={18} />
              Start Exam
            </button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['Quantum Electrodynamics', 'Game Theory', 'Microbiology', 'Political Science'].map(t => (
              <button 
                key={t}
                onClick={() => { setTopic(t); }}
                className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 hover:text-rose-600 hover:border-rose-100 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="animate-spin text-rose-600 mb-6" size={48} />
          <h3 className="text-xl font-display font-bold text-gray-900">Preparing Exam Papers...</h3>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2">Rigorous Validation in Progress</p>
        </div>
      )}

      {examStarted && (
        <div className="space-y-8 pb-32">
          {/* Header Sticky Container */}
          <div className="sticky top-0 z-50 bg-[#F8F9FB]/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-gray-200 mb-8 rounded-b-3xl">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <Timer size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Time Remaining</p>
                      <p className={cn(
                        "text-2xl font-display font-black leading-none",
                        timeLeft < 60 ? "text-rose-600 animate-pulse" : "text-gray-900"
                      )}>{formatTime(timeLeft)}</p>
                   </div>
                </div>
                <button 
                  onClick={submitExam}
                  className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
                >
                  Submit Exam
                </button>
             </div>
          </div>

          <div className="space-y-12">
            {questions.map((q, qIndex) => (
              <motion.div 
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-8">
                   <span className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                     {qIndex + 1}
                   </span>
                   <h3 className="text-xl font-display font-bold text-gray-900 leading-tight">
                     {q.question}
                   </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((option, aIndex) => (
                    <button
                      key={aIndex}
                      onClick={() => handleAnswerChange(qIndex, aIndex)}
                      className={cn(
                        "p-6 rounded-2xl text-left font-bold text-sm transition-all flex items-center gap-4 border-2",
                        userAnswers[qIndex] === aIndex 
                          ? "bg-rose-50 border-rose-200 text-rose-700" 
                          : "bg-[#F8F9FB] border-transparent hover:border-gray-200 text-gray-700"
                      )}
                    >
                      <span className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 uppercase text-[10px] border shadow-sm",
                        userAnswers[qIndex] === aIndex ? "bg-rose-600 text-white border-rose-500" : "bg-white text-gray-400 border-gray-100"
                      )}>
                        {String.fromCharCode(65 + aIndex)}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center p-12">
             <button 
                onClick={submitExam}
                className="px-12 py-6 bg-rose-600 text-white rounded-[2rem] font-bold text-xl shadow-2xl shadow-rose-100 hover:bg-rose-700 transition-all hover:scale-105 active:scale-95"
              >
                Finalize & Submit Exam
              </button>
          </div>
        </div>
      )}

      {examComplete && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-100 rounded-[3rem] p-12 text-center shadow-xl overflow-hidden relative"
        >
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100%] z-0" />
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <Award size={48} />
            </div>
            <h2 className="text-4xl font-display font-black text-gray-900 mb-2">Exam Results</h2>
            <p className="text-gray-500 font-medium mb-12 italic">Target Subject: {topic}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
              <div className="bg-[#F8F9FB] p-6 rounded-[2rem] border border-gray-50">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Grade</p>
                <p className={cn(
                  "text-5xl font-display font-black",
                  (score/questions.length) >= 0.8 ? "text-emerald-500" : "text-gray-900"
                )}>
                  { (score/questions.length) >= 0.9 ? 'A+' : (score/questions.length) >= 0.8 ? 'A' : (score/questions.length) >= 0.7 ? 'B' : (score/questions.length) >= 0.6 ? 'C' : 'F' }
                </p>
              </div>
              <div className="bg-[#F8F9FB] p-6 rounded-[2rem] border border-gray-50">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Mastery</p>
                <p className="text-4xl font-display font-black text-gray-900">{Math.round((score / questions.length) * 100)}%</p>
              </div>
              <div className="bg-[#F8F9FB] p-6 rounded-[2rem] border border-gray-50">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Correct</p>
                <p className="text-4xl font-display font-black text-gray-900">{score}/{questions.length}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <button 
                onClick={() => { setExamComplete(false); setTopic(''); }}
                className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-bold shadow-2xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-all active:scale-95"
              >
                <RefreshCcw size={20} />
                New Exam
              </button>
              <button className="px-10 py-5 bg-white text-gray-900 rounded-[2rem] font-bold shadow-xl border border-gray-100 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95">
                <Award size={20} />
                Claim Certification
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
