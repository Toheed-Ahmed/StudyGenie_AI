'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Loader2, HelpCircle, CheckCircle2, XCircle, RefreshCcw, ArrowRight, Award, Trophy, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function QuizPage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setShowExplanation(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      
      const prompt = `Generate a rigorous academic quiz about "${topic}".
      Return exactly 5 Multiple Choice Questions in JSON format.
      Be extremely concise. No extra keys. No markdown outside JSON.
      Each question must have:
      - question
      - options: array of 4
      - correctAnswer: 0-3
      - explanation: logical justification.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      let data;
      try {
        data = JSON.parse(cleanJson);
      } catch (e) {
        // Fallback for cases where it yields markdown or text around JSON
        const jsonMatch = cleanJson.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid format received");
        }
      }
      
      let rawQuestions = [];
      if (Array.isArray(data)) {
        rawQuestions = data;
      } else if (data && Array.isArray(data.questions)) {
        rawQuestions = data.questions;
      } else if (data && typeof data === 'object') {
        // Find any array property if it's not named 'questions'
        const arrayProp = Object.values(data).find(val => Array.isArray(val));
        if (arrayProp) rawQuestions = arrayProp as any[];
      }

      if (!rawQuestions || rawQuestions.length === 0) {
        throw new Error("No questions found in response");
      }
      
      const formattedQuestions = rawQuestions.map((q: any, i: number) => ({
        id: i,
        question: q.question || 'Untitled Question',
        options: Array.isArray(q.options) ? q.options : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || 'No explanation provided.'
      }));
      
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error("Quiz generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2">AI Quiz <span className="text-indigo-600">Generator</span></h1>
        <p className="text-gray-500 font-medium italic">Challenge your knowledge with dynamically generated rigorous assessments.</p>
      </div>

      {!questions.length && !isLoading ? (
        /* Topic Selection */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm text-center"
        >
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <Brain size={40} />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">What should we test today?</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Enter any topic, from &quot;Quantum Mechanics&quot; to &quot;Renaissance Art&quot;, and our AI will craft a high-fidelity assessment for you.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Behavioral Economics, Organic Chemistry..."
              className="flex-1 px-6 py-4 bg-[#F8F9FB] border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && generateQuiz()}
            />
            <button 
              onClick={generateQuiz}
              disabled={!topic.trim()}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={18} />
              Generate
            </button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['Astrophysics', 'Global Finance', 'Neuroscience', 'Medieval History'].map(t => (
              <button 
                key={t}
                onClick={() => { setTopic(t); }}
                className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>
      ) : isLoading ? (
        /* Loading State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="animate-spin text-indigo-600 mb-6" size={48} />
          <h3 className="text-xl font-display font-bold text-gray-900">Crafting your assessment...</h3>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2">Consulting Digital Library</p>
        </div>
      ) : quizComplete ? (
        /* Results State */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-100 rounded-[3rem] p-12 text-center shadow-xl"
        >
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <Trophy size={48} />
          </div>
          <h2 className="text-4xl font-display font-black text-gray-900 mb-2">Quiz Complete!</h2>
          <p className="text-gray-500 font-medium mb-12 italic">Target: {topic}</p>
          
          <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mb-12">
            <div className="bg-[#F8F9FB] p-6 rounded-[2rem] border border-gray-50">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Score</p>
              <p className="text-4xl font-display font-black text-gray-900">{Math.round((score / questions.length) * 100)}%</p>
            </div>
            <div className="bg-[#F8F9FB] p-6 rounded-[2rem] border border-gray-50">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Correct</p>
              <p className="text-4xl font-display font-black text-gray-900">{score}/{questions.length}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button 
              onClick={() => { setQuestions([]); setTopic(''); }}
              className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-bold shadow-2xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-all active:scale-95"
            >
              <RefreshCcw size={20} />
              Try New Topic
            </button>
            <button className="px-10 py-5 bg-white text-gray-900 rounded-[2rem] font-bold shadow-xl border border-gray-100 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95">
              <Award size={20} />
              View Portfolio
            </button>
          </div>
        </motion.div>
      ) : (
        /* Quiz Gameplay */
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                 {currentQuestionIndex + 1}
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Question {currentQuestionIndex + 1} of {questions.length}</p>
                  <p className="text-sm font-bold text-gray-900">{topic}</p>
               </div>
            </div>
            <div className="h-2 flex-1 max-w-[200px] bg-gray-100 rounded-full mx-8 overflow-hidden">
               <motion.div 
                 className="h-full bg-indigo-600" 
                 initial={{ width: 0 }}
                 animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
               />
            </div>
          </div>

          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm"
          >
            <h3 className="text-xl sm:text-2xl font-display font-bold text-gray-900 mb-10 leading-tight">
              {questions[currentQuestionIndex].question}
            </h3>

            <div className="space-y-3">
              {questions[currentQuestionIndex].options.map((option, i) => (
                <button
                  key={i}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleAnswerSelect(i)}
                  className={cn(
                    "w-full p-6 rounded-2xl text-left font-bold text-sm transition-all flex items-center justify-between group",
                    selectedAnswer === null 
                      ? "bg-[#F8F9FB] hover:bg-indigo-50 border border-transparent hover:border-indigo-100 text-gray-700" 
                      : i === questions[currentQuestionIndex].correctAnswer
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : selectedAnswer === i
                          ? "bg-rose-50 border border-rose-200 text-rose-700"
                          : "bg-gray-50 opacity-50 border border-transparent text-gray-400"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 uppercase text-[10px]">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </div>
                  {selectedAnswer !== null && i === questions[currentQuestionIndex].correctAnswer && (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  )}
                  {selectedAnswer === i && i !== questions[currentQuestionIndex].correctAnswer && (
                    <XCircle size={20} className="text-rose-500" />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {showExplanation && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-10 p-8 bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-4">
                     <HelpCircle size={18} className="text-indigo-600" />
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Logical Depth</h4>
                  </div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                    {questions[currentQuestionIndex].explanation}
                  </p>
                  
                  <button 
                    onClick={nextQuestion}
                    className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all animate-pulse"
                  >
                    {currentQuestionIndex === questions.length - 1 ? "Finish Assessment" : "Next Question"}
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}
