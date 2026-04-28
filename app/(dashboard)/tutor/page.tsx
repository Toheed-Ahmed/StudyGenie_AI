'use client';

import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Send, Loader2, Bot, User as UserIcon, RefreshCcw, History, X, Award, Lock, Unlock, CheckCircle2, FileText, Gauge, ChevronDown, HelpCircle, Target, Zap, GraduationCap, Mic, Volume2, VolumeX, StickyNote, Download, Save } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import CertificateModal from '@/components/CertificateModal';
import ReactMarkdown from 'react-markdown';

type DifficultyMode = 'beginner' | 'guided' | 'challenge' | 'exam';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  messages: any[];
  is_mastered?: boolean;
  mastery_score?: number;
}

export default function TutorPage() {
  const { user } = useAuth();
  const { setActiveSession } = useSession();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isMastered, setIsMastered] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExplanationMode, setIsExplanationMode] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyMode>('guided');
  const [isDiffMenuOpen, setIsDiffMenuOpen] = useState(false);
  const [masteryScore, setMasteryScore] = useState<number | null>(null);
  const [revealedSolution, setRevealedSolution] = useState<string | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [userMemory, setUserMemory] = useState<{
    strong_topics: string[];
    weak_topics: string[];
    mistakes: string[];
    learning_style: string;
  } | null>(null);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0];

  useEffect(() => {
    if (!user) return;
    
    const fetchMemory = async () => {
      const { data, error } = await supabase
        .from('user_memories')
        .select('*')
        .single();
      
      if (!error && data) {
        setUserMemory(data);
      }
    };

    fetchMemory();
  }, [user]);

  // Sync active session with global context
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const current = sessions.find(s => s.id === currentSessionId);
      if (current) {
        setActiveSession({
          id: current.id,
          title: current.title,
          mastery_score: masteryScore || current.mastery_score
        });
      }
    } else {
      setActiveSession(null);
    }
  }, [currentSessionId, sessions, masteryScore, setActiveSession]);

  useEffect(() => {
    if (!user) return;
    
    let active = true;
    (async () => {
      setIsSessionsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tutor_sessions')
          .select('id, title, created_at, is_mastered, mastery_score')
          .order('created_at', { ascending: false });
        
        if (active) {
          if (error) throw error;
          setSessions((data || []) as Session[]);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        if (active) setIsSessionsLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user]);

  const fetchSessions = useCallback(async () => {
    setIsSessionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const playSpeech = async (text: string) => {
    if (!text) return;
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const audioData = audioPart?.inlineData?.data;
      const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';

      if (audioData) {
        let finalAudioData = audioData;
        let finalMimeType = mimeType;

        // Wrap L16 in WAV header for browser compatibility
        if (mimeType.includes('audio/l16')) {
          const rawData = atob(audioData);
          const buffer = new ArrayBuffer(rawData.length + 44);
          const view = new DataView(buffer);
          
          const sampleRate = 24000;
          const numChannels = 1;
          const bitsPerSample = 16;

          view.setUint32(0, 0x52494646, false); // "RIFF"
          view.setUint32(4, 36 + rawData.length, true);
          view.setUint32(8, 0x57415645, false); // "WAVE"
          view.setUint32(12, 0x666d7420, false); // "fmt "
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true); // PCM
          view.setUint16(22, numChannels, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
          view.setUint16(32, numChannels * (bitsPerSample / 8), true);
          view.setUint16(34, bitsPerSample, true);
          view.setUint32(36, 0x64617461, false); // "data"
          view.setUint32(40, rawData.length, true);
          
          for (let i = 0; i < rawData.length; i++) {
            view.setUint8(44 + i, rawData.charCodeAt(i));
          }
          
          const binaryArray = new Uint8Array(buffer);
          let binaryString = '';
          for (let i = 0; i < binaryArray.length; i++) {
            binaryString += String.fromCharCode(binaryArray[i]);
          }
          finalAudioData = btoa(binaryString);
          finalMimeType = 'audio/wav';
        }

        const audio = new Audio(`data:${finalMimeType};base64,${finalAudioData}`);
        audio.onerror = (e) => {
          console.error("Audio Load Error (Tutor):", e, "MimeType:", mimeType);
        };
        await audio.play().catch(err => {
          console.warn("Speech playback blocked or failed:", err);
        });
      }
    } catch (error) {
      console.error("TTS Error (Tutor):", error);
    }
  };

  const generateSmartNotes = async () => {
    if (messages.length === 0) return;
    setIsGeneratingNotes(true);
    setSaveStatus('idle');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const chatContext = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      
      const prompt = `Based on the following Socratic dialogue, generate a set of high-fidelity 'Smart Notes'.
      The notes should:
      1. Define the core concepts discussed.
      2. Outline the logical steps and mechanisms uncovered.
      3. Highlight any key analogies or insights.
      4. List the 'Knowledge Milestones' achieved.
      
      Format the response in clean Markdown.
      
      DIALOGUE:
      ${chatContext}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const notes = response.text || "Failed to generate notes.";
      setGeneratedNotes(notes);

      // Attempt initial save
      await saveToVault(notes);
    } catch (error) {
      console.error("Notes generation error:", error);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const saveToVault = async (notesToSave?: string) => {
    const content = notesToSave || generatedNotes;
    if (!content || !currentSessionId || !user) return;
    
    setIsSavingNote(true);
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('smart_notes')
        .upsert({
          user_id: user.id,
          session_id: currentSessionId,
          topic: sessions.find(s => s.id === currentSessionId)?.title || 'Learning Session',
          content: content,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      setSaveStatus('saved');
    } catch (error) {
      console.error("Save to vault error:", error);
      setSaveStatus('error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!generatedNotes) return;
    
    const element = document.getElementById('smart-notes-content');
    if (!element) return;

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Force plain background on body/html to avoid oklch inheritance
          const html = clonedDoc.documentElement;
          const body = clonedDoc.body;
          if (html) { html.style.colorScheme = 'light'; html.style.backgroundColor = '#ffffff'; }
          if (body) { body.style.backgroundColor = '#ffffff'; }

          // Completely remove all stylesheets that might contain oklch or modern CSS
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());
          
          const el = clonedDoc.getElementById('smart-notes-content');
          if (el) {
            // Force basic styles on the target element and all its children
            // We use an aggressive regex-based cleanup for any remaining oklch in inline styles
            const allElements = el.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const node = allElements[i] as HTMLElement;
              if (node.getAttribute?.('style')) {
                const styleAttr = node.getAttribute('style') || '';
                if (styleAttr.includes('oklch')) {
                  node.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/g, '#000000'));
                }
              }
            }

            el.style.backgroundColor = '#ffffff';
            el.style.color = '#000000';
            el.style.padding = '40px';
            el.style.fontFamily = 'Arial, sans-serif';
            el.style.width = '800px';
            
            // Re-apply basic, safe formatting
            const safeStyle = clonedDoc.createElement('style');
            safeStyle.textContent = `
              #smart-notes-content { 
                background: #fff !important;
                color: #000 !important;
                font-family: Arial, sans-serif !important;
                line-height: 1.5 !important;
                width: 800px !important;
                margin: 0 auto !important;
              }
              h1 { font-size: 24px !important; margin-bottom: 20px !important; color: #000 !important; }
              h2 { font-size: 20px !important; margin-top: 25px !important; margin-bottom: 15px !important; color: #000 !important; }
              h3 { font-size: 18px !important; margin-top: 20px !important; margin-bottom: 10px !important; color: #000 !important; }
              p { margin-bottom: 12px !important; color: #000 !important; }
              ul, ol { margin-bottom: 12px !important; padding-left: 20px !important; color: #000 !important; }
              li { margin-bottom: 5px !important; color: #000 !important; }
              code { background: #eee !important; padding: 2px 4px !important; color: #000 !important; }
              pre { background: #eee !important; padding: 10px !important; margin-bottom: 12px !important; color: #000 !important; overflow: visible !important; white-space: pre-wrap !important; }
            `;
            clonedDoc.head.appendChild(safeStyle);
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const filename = `StudyGenie_Notes_${new Date().getTime()}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, streamingAnswer]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      let sessionId = currentSessionId;
      if (!sessionId) {
        const title = input.trim().substring(0, 40) + (input.trim().length > 40 ? '...' : '');
        const { data, error: sessionError } = await supabase
          .from('tutor_sessions')
          .insert({
            user_id: user?.id,
            title,
            messages: newMessages
          })
          .select()
          .single();
        
        if (sessionError) throw sessionError;
        sessionId = data.id;
        setCurrentSessionId(sessionId);
        fetchSessions();
      } else {
        await supabase
          .from('tutor_sessions')
          .update({ 
            messages: newMessages,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const memoryContext = userMemory ? `
USER MEMORY (Personalize your inquiry based on this):
- Strong Topics: ${userMemory.strong_topics.join(', ') || 'Unknown'}
- Weak Topics: ${userMemory.weak_topics.join(', ') || 'Unknown'}
- Past Mistakes/Logic Gaps: ${userMemory.mistakes.join(', ') || 'None reported'}
- Preferred Learning Style: ${userMemory.learning_style || 'Inquiry-based'}` : '';

      const difficultyInstructions = {
        beginner: "LEVEL: BEGINNER. Be very patient. Provide more scaffolding and analogies. Your hints can be more frequent, though still never give the answer.",
        guided: "LEVEL: GUIDED (DEFAULT). Balance probing questions with subtle nudges when they get stuck. Standard Socratic method.",
        challenge: "LEVEL: CHALLENGE. Be strict. Do not provide hints easily. Push the student to their cognitive limits. Expect high precision.",
        exam: "LEVEL: EXAM. No hints whatsoever. Only ask probing questions to expose logic gaps. Do not provide any scaffolding."
      };

      const baseInstruction = `You are a Socratic AI Tutor called 'StudyGenie AI'. ${memoryContext}
      ${difficultyInstructions[difficulty]}`;

      const socraticInstruction = `${baseInstruction}
Your goal is to guide students to deep understanding through inquiry-based learning. 

BEHAVIOR RULES (INTENT-BASED):
1. NO INTRODUCTORY FILLER: DO NOT use pleasantries like "Sure", "I'd be happy to help", or "Let's get started". Jump immediately into the diagnostic or Socratic question.
2. INTENT EXTRACTION: Identify the core concept or logic the student is struggling with or exploring. Ignore filler words.
3. NO VERBOSITY: Keep responses strictly under 3 paragraphs. Use clear, simple language.
4. SOCRATIC PURITY: NEVER provide direct answers. Respond exclusively with one or two targeted questions.

Clean Output formatting:
- Use clean Markdown.
- Use lists selectively.
- Avoid excessive bolding.
- Append [MEMORY_UPDATE: {"strong_topics": [], "weak_topics": [], "mistakes": [], "learning_style":""}] only for significant insights.`;

      const evaluationInstruction = `${baseInstruction}
The student is now attempting to explain the concept back to you to prove their mastery.

BEHAVIOR RULES (CONCEPTUAL FOCUS):
1. EVALUATE LOGIC: Focus on whether they understand the "How" and "Why", not just the terminology. 
2. IGNORE FLUFF: If their response is long but conceptually thin, score it low. If it's short but captures the core causal link perfectly, score it high.
3. NO VERBOSE FEEDBACK: Be precise in identifying the logical gap.

Clean Output formatting:
1. Assign a Mastery Score (0-100).
2. If Score >= 80: START with [UNLOCK_MASTERY] [SCORE: 80-100]. This is your final reward to the student. Reveal the COMPLETE, comprehensive solution, including all technical details, nuances, and a structural summary of the concept. This should be the 'Ultimate Answer' they were working towards via the Socratic process.
3. If Score < 80: START with [SCORE: 0-79]. Identify the specific logical disconnect and ask one guiding question.
4. Keep the response structural (paragraphs/bullets) and readable.`;

      const result = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: input.trim() }] }
        ],
        config: {
          systemInstruction: isExplanationMode ? evaluationInstruction : socraticInstruction
        }
      });

      let responseText = '';
      for await (const chunk of result) {
        const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
        responseText += chunkText;
        setStreamingAnswer(responseText);
      }
      
      setStreamingAnswer('');
      
      // Handle Score and Mastery
      let masteryUnlocked = false;
      let sessionScore = 0;

      // Extract Score
      const scoreMatch = responseText.match(/\[SCORE: (\d+)\]/);
      if (scoreMatch) {
        sessionScore = parseInt(scoreMatch[1], 10);
        responseText = responseText.replace(/\[SCORE: \d+\]/, '').trim();
        setMasteryScore(sessionScore);
      }

      // Mastery Detection (Threshold: 80)
      if (responseText.includes('[UNLOCK_MASTERY]') || sessionScore >= 80) {
        masteryUnlocked = true;
        responseText = responseText.replace('[UNLOCK_MASTERY]', '').trim();
        setIsMastered(true);
        setRevealedSolution(responseText);
      }

      // Handle Memory Updates
      // Robust regex to handle nested brackets in JSON (specifically arrays inside the update tag)
      const memoryRegex = /\[MEMORY_UPDATE:\s*(\{[\s\S]*?\})\s*\]/;
      const updateMatch = responseText.match(memoryRegex);
      
      if (updateMatch && updateMatch[1]) {
        try {
          const updates = JSON.parse(updateMatch[1]);
          const newMemory = {
            strong_topics: Array.from(new Set([...(userMemory?.strong_topics || []), ...(updates.strong_topics || [])])),
            weak_topics: Array.from(new Set([...(userMemory?.weak_topics || []), ...(updates.weak_topics || [])])),
            mistakes: Array.from(new Set([...(userMemory?.mistakes || []), ...(updates.mistakes || [])])),
            learning_style: updates.learning_style || userMemory?.learning_style || 'Inquiry-based'
          };

          setUserMemory(newMemory);
          
          // Persist to Supabase
          await supabase
            .from('user_memories')
            .upsert({ user_id: user?.id, ...newMemory });

        } catch (e) {
          console.error("Memory parsing error:", e);
        }
        // Remove the tag after processing
        responseText = responseText.replace(memoryRegex, '').trim();
      }

      // If we were in explanation mode and successfully sent, return to regular mode
      if (isExplanationMode) {
        setIsExplanationMode(false);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      if (sessionId) {
        await supabase
          .from('tutor_sessions')
          .update({ 
            messages: finalMessages,
            is_mastered: masteryUnlocked || isMastered,
            mastery_score: sessionScore || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

    } catch (error) {
      console.error("Gemini/Supabase Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingAnswer('');
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const { error } = await supabase
        .from('tutor_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      if (currentSessionId === id) {
        resetChat();
      }
      fetchSessions();
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setCurrentSessionId(null);
    setIsMastered(false);
    setMasteryScore(null);
    setRevealedSolution(null);
    setIsHistoryOpen(false);
  };

  const openSession = async (session: Session) => {
    setCurrentSessionId(session.id);
    const isMastery = !!session.is_mastered;
    setIsMastered(isMastery);
    setMasteryScore(session.mastery_score || null);
    
    // Fetch full messages only when session is opened
    try {
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('messages')
        .eq('id', session.id)
        .single();
      
      if (error) throw error;
      
      if (data?.messages) {
        const mappedMessages = data.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(mappedMessages);

        if (isMastery) {
          // Find the last assistant message and set as revealed solution
          const lastAssistant = [...mappedMessages].reverse().find(m => m.role === 'assistant');
          if (lastAssistant) {
            setRevealedSolution(lastAssistant.content);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching session messages:", error);
    }
    setIsHistoryOpen(false);
  };

  const renderHistoryContent = () => (
    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
      {isSessionsLoading ? (
        [1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-full h-16 bg-gray-50 animate-pulse rounded-2xl border border-gray-50 mb-2" />
        ))
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 opacity-40">
          <p className="text-xs font-bold uppercase tracking-widest">No history yet</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => openSession(session)}
            onKeyDown={(e) => e.key === 'Enter' && openSession(session)}
            role="button"
            tabIndex={0}
            className={cn(
              "w-full text-left p-4 rounded-2xl transition-all group border border-transparent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              currentSessionId === session.id 
                ? "bg-indigo-50 border-indigo-100" 
                : "hover:bg-gray-50"
            )}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={cn(
                    "text-sm font-bold truncate",
                    currentSessionId === session.id ? "text-indigo-600" : "text-gray-700"
                  )}>
                    {session.title}
                  </p>
                  {session.is_mastered && (
                    <div className="bg-green-100 text-green-600 p-0.5 rounded-full" title="Mastered">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-medium text-gray-400 group-hover:text-indigo-400 transition-colors">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                  {session.mastery_score !== undefined && (
                    <span className="text-[10px] font-bold text-indigo-400">
                      • {session.mastery_score}%
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={(e) => deleteSession(e, session.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all rounded-md hover:bg-red-50 focus:opacity-100 outline-none"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-120px)] relative">
      {/* Smart Notes Modal */}
      <AnimatePresence>
        {generatedNotes && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGeneratedNotes(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl max-h-[80vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <StickyNote size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black leading-tight">Smart Notes</h2>
                    <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Logic Distillation complete</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={downloadAsPDF}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2"
                    title="Export as PDF"
                  >
                    <Download size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">PDF</span>
                  </button>
                  <button 
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([generatedNotes], {type: 'text/markdown'});
                      element.href = URL.createObjectURL(file);
                      element.download = "StudyGenie_AI_Notes.md";
                      document.body.appendChild(element);
                      element.click();
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                    title="Export as Markdown"
                  >
                    <FileText size={20} />
                  </button>
                  <button 
                    onClick={() => setGeneratedNotes(null)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 sm:p-12 scrollbar-thin">
                <div id="smart-notes-content" className="prose prose-indigo max-w-none prose-headings:font-display prose-headings:font-black prose-p:font-medium prose-p:text-gray-600 bg-white">
                  <ReactMarkdown>{generatedNotes}</ReactMarkdown>
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center shrink-0">
                 <button 
                   onClick={() => saveToVault()}
                   disabled={isSavingNote || saveStatus === 'saved'}
                   className={cn(
                     "px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 min-w-[200px] justify-center",
                     saveStatus === 'saved' 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
                   )}
                 >
                   {isSavingNote ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                   ) : saveStatus === 'saved' ? (
                     <CheckCircle2 size={16} />
                   ) : (
                     <Save size={16} />
                   )}
                   {isSavingNote ? 'Syncing...' : saveStatus === 'saved' ? 'Perfectly Crystallized' : 'Save to Vault'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Overlay */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsHistoryOpen(false)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
          />
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2 }}
            className="fixed inset-y-0 left-0 w-80 bg-white z-[70] p-6 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-display font-black text-gray-900">History</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <button 
              onClick={resetChat}
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-bold mb-6 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Sparkles size={18} />
              New Session
            </button>
            {renderHistoryContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sessions Sidebar - REMOVED per user request to maximize chat space */}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex justify-between items-center px-4 sm:px-0">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white border border-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all shadow-sm shrink-0"
              title="View History"
            >
              <History size={18} className="sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-3xl font-display font-black text-gray-900 leading-tight truncate">
                Socratic <span className="text-indigo-600">Tutor</span>
              </h1>
              <p className="hidden xs:block text-[10px] sm:text-sm font-medium text-gray-500 truncate">Mastery through focused inquiry.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Difficulty Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDiffMenuOpen(!isDiffMenuOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm border",
                  difficulty === 'beginner' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                  difficulty === 'guided' && "bg-indigo-50 text-indigo-600 border-indigo-100",
                  difficulty === 'challenge' && "bg-amber-50 text-amber-600 border-amber-100",
                  difficulty === 'exam' && "bg-rose-50 text-rose-600 border-rose-100"
                )}
              >
                <Gauge size={14} />
                <span className="hidden xs:inline">{difficulty}</span>
                <ChevronDown size={14} className={cn("transition-transform", isDiffMenuOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isDiffMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDiffMenuOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                    >
                      {[
                        { id: 'beginner', icon: HelpCircle, color: 'text-emerald-500', bg: 'hover:bg-emerald-50', desc: 'Frequent hints & scaffolding' },
                        { id: 'guided', icon: Target, color: 'text-indigo-500', bg: 'hover:bg-indigo-50', desc: 'Standard Socratic method' },
                        { id: 'challenge', icon: Zap, color: 'text-amber-500', bg: 'hover:bg-amber-50', desc: 'Strict mode, fewer hints' },
                        { id: 'exam', icon: GraduationCap, color: 'text-rose-500', bg: 'hover:bg-rose-50', desc: 'Zero help, total mastery' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setDifficulty(mode.id as DifficultyMode);
                            setIsDiffMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-xl transition-all flex items-start gap-3",
                            mode.bg,
                            difficulty === mode.id && "bg-gray-50"
                          )}
                        >
                          <div className={cn("mt-0.5", mode.color)}>
                            <mode.icon size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{mode.id}</p>
                            <p className="text-[10px] font-medium text-gray-400 leading-tight">{mode.desc}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {messages.length > 0 && (
              <button 
                onClick={resetChat}
                className="flex items-center gap-2 h-10 w-10 sm:w-auto sm:px-4 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-400 hover:text-indigo-600 transition-all uppercase tracking-widest shadow-sm"
              >
                <RefreshCcw size={14} />
                <span className="hidden sm:inline">New Session</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden relative">
        {messages.length === 0 ? (
          /* Initial state / Zero state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md"
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shrink-0 mx-auto mb-8">
                <Brain size={40} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-4">Hello, {firstName}!</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-10">
                Ready to explore a new concept? Tell me what you&apos;re learning, and I&apos;ll help you probe the deeper logic behind it.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Quantum Physics', 'Global Economics', 'Cellular Biology', 'Philosophy'].map((topic) => (
                  <button 
                    key={topic}
                    onClick={() => setInput(`I'm learning about ${topic}...`)}
                    className="px-4 py-3 bg-[#F8F9FB] border border-gray-50 rounded-2xl text-sm font-bold text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all text-left flex items-center justify-between group"
                  >
                    {topic}
                    <Sparkles size={14} className="opacity-0 group-hover:opacity-100 transition-all text-indigo-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Chat Area */
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth"
          >
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-4 max-w-3xl",
                    message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100",
                    message.role === 'user' ? "bg-indigo-600 text-white order-2" : "bg-white text-indigo-600"
                  )}>
                    {message.role === 'user' ? <UserIcon size={18} /> : <Bot size={18} />}
                  </div>
                  <div className={cn(
                    "px-4 sm:px-6 py-3 sm:py-4 rounded-3xl text-sm sm:text-[15px] leading-relaxed shadow-sm relative max-w-[85%] sm:max-w-[80%]",
                    message.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none ml-auto font-medium" 
                      : "bg-[#F8F9FB] text-gray-800 rounded-tl-none border border-gray-50 mr-auto markdown-content"
                  )}>
                    {message.role === 'user' ? (
                      message.content
                    ) : (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    )}
                    
                    {message.role === 'assistant' && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           {isMastered && messages[messages.length - 1].id === message.id && (
                            <div className="flex items-center gap-2">
                              <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                                <CheckCircle2 size={10} />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Mastery Recorded</span>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => playSpeech(message.content)}
                          className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-indigo-600 transition-all active:scale-95 shadow-sm border border-transparent hover:border-gray-100"
                          title="Speak Message"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {streamingAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 max-w-3xl mr-auto"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 bg-white text-indigo-600">
                  <Bot size={18} />
                </div>
                <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-3xl text-sm sm:text-[15px] leading-relaxed shadow-sm relative max-w-[85%] sm:max-w-[80%] bg-[#F8F9FB] text-gray-800 rounded-tl-none border border-gray-50 mr-auto markdown-content">
                   <ReactMarkdown>{streamingAnswer}</ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* Answer Lock System UI */}
            <AnimatePresence mode="wait">
              {!isMastered ? (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-3xl mx-auto py-8"
                >
                  <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-8 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                        <Lock className="text-gray-300" size={32} />
                      </div>
                      <h3 className="text-lg font-display font-bold text-gray-900 mb-2">Final Answer Locked</h3>
                      {masteryScore && masteryScore > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-indigo-600 mb-1 px-1">
                            <span>Current Score</span>
                            <span>{masteryScore}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${masteryScore}%` }}
                              className="h-full bg-indigo-600"
                            />
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto mb-6">
                        StudyGenie is waiting for your comprehensive explanation before revealing the complete summary.
                      </p>
                      <button 
                        onClick={() => setIsExplanationMode(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-indigo-600 shadow-sm hover:border-indigo-200 transition-all active:scale-95"
                      >
                        <Award size={14} />
                        Prove Mastery to Unlock
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="unlocked"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="max-w-3xl mx-auto py-8"
                >
                  <div className="bg-green-50/50 border-2 border-green-100 rounded-[2rem] p-8 text-center relative overflow-hidden shadow-sm shadow-green-100/50">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-16 h-16 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-200 flex items-center justify-center mx-auto mb-4"
                    >
                      <Unlock size={32} />
                    </motion.div>
                    <motion.h3 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl font-display font-black text-green-900 mb-1"
                    >
                      Mastery Achieved!
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-sm text-green-700 font-bold uppercase tracking-widest mb-6"
                    >
                      Final Mastery Unlock Active {masteryScore && `• Score: ${masteryScore}`}
                    </motion.p>

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="text-left bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-green-100 mb-8 max-h-[400px] overflow-y-auto shadow-inner"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-green-500 text-white rounded-lg">
                          <CheckCircle2 size={14} />
                        </div>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-green-700">Verified Solution & Summary</span>
                      </div>
                      <div className="prose prose-sm sm:prose-base prose-green max-w-none text-green-900 font-medium leading-relaxed markdown-content">
                        <ReactMarkdown>
                          {revealedSolution || ''}
                        </ReactMarkdown>
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      onClick={() => setIsCertificateOpen(true)}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
                    >
                      <FileText size={16} />
                      View Certificate
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Certificate Modal */}
            {currentSessionId && (
              <CertificateModal 
                isOpen={isCertificateOpen}
                onClose={() => setIsCertificateOpen(false)}
                data={{
                  userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student',
                  topic: sessions.find(s => s.id === currentSessionId)?.title || 'Abstract Concepts',
                  score: masteryScore || 0,
                  date: new Date().toLocaleDateString(),
                  id: currentSessionId
                }}
              />
            )}
            
            {isLoading && !streamingAnswer && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex gap-4 mr-auto"
              >
                <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center border-2 border-white shadow-sm italic">
                  <Bot size={18} />
                </div>
                <div className="bg-[#F8F9FB] border border-gray-50 px-6 py-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-indigo-600" />
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div className="h-4" />
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 sm:p-6 bg-white border-t border-gray-50">
          <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2 justify-between items-center px-1">
            {messages.length > 0 && !isExplanationMode && (
              <button 
                onClick={() => setIsExplanationMode(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] sm:text-xs font-bold hover:bg-indigo-100 transition-all shadow-sm border border-indigo-100"
              >
                <Award size={14} />
                Prove Mastery
              </button>
            )}
            {isExplanationMode && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-[10px] sm:text-xs font-bold border border-amber-100 animate-pulse">
                <Sparkles size={12} />
                Challenge Active
                <button onClick={() => setIsExplanationMode(false)} className="ml-2 hover:text-amber-900 underline">Exit</button>
              </div>
            )}
            {messages.length > 2 && !isGeneratingNotes && !isExplanationMode && (
              <button 
                onClick={generateSmartNotes}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-600 rounded-xl text-[10px] sm:text-xs font-bold hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm border border-gray-100"
              >
                <StickyNote size={14} />
                Notes
              </button>
            )}
            {isGeneratingNotes && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] sm:text-xs font-bold border border-indigo-100 italic animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                Distilling...
              </div>
            )}
          </div>

          <div className="relative max-w-3xl mx-auto">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isExplanationMode ? "Explain the mechanism..." : "Ask StudyGenie..."}
              className={cn(
                "w-full p-4 pr-24 sm:pr-32 rounded-2xl border outline-none transition-all font-medium resize-none shadow-inner text-sm sm:text-base min-h-[56px] sm:min-h-[64px]",
                isExplanationMode 
                  ? "bg-amber-50/30 border-amber-200 focus:border-amber-600 focus:bg-white text-gray-900" 
                  : "bg-[#F8F9FB] border-transparent focus:border-indigo-600 focus:bg-white text-gray-900"
              )}
            />
            <div className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={toggleListening}
                className={cn(
                  "h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-95 border",
                  isListening ? "bg-rose-100 border-rose-200 text-rose-600 animate-pulse" : "bg-gray-50 border-gray-100 text-gray-400"
                )}
                title="Voice Input"
              >
                <Mic size={16} className={isListening ? "animate-bounce" : ""} />
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "h-8 w-8 sm:h-10 sm:w-10 text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:scale-100",
                  isExplanationMode ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"
                )}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
            StudyGenie AI may produce inaccurate information.
          </p>
        </div>
      </div>
    </div>
  </div>
);
}
