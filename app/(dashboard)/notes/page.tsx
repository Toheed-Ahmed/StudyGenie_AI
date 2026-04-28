'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StickyNote, 
  Search, 
  Download, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  X,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Note {
  id: string;
  topic: string;
  content: string;
  created_at: string;
}

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('smart_notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNotes();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchNotes]);

  const deleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete these notes?")) return;
    try {
      const { error } = await supabase
        .from('smart_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadAsPDF = async () => {
    if (!selectedNote) return;
    
    const element = document.getElementById('note-content-pdf');
    if (!element) return;

    setIsExportingPDF(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, 
        onclone: (clonedDoc) => {
          // Force plain background on body/html to avoid oklch inheritance
          const html = clonedDoc.documentElement;
          const body = clonedDoc.body;
          if (html) { html.style.colorScheme = 'light'; html.style.backgroundColor = '#ffffff'; }
          if (body) { body.style.backgroundColor = '#ffffff'; }

          // Completely remove all stylesheets that might contain oklch or modern CSS
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());

          const el = clonedDoc.getElementById('note-content-pdf');
          if (el) {
            // Force basic styles on the target element and all its children
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
            
            // Re-apply basic, safe formatting
            const safeStyle = clonedDoc.createElement('style');
            safeStyle.textContent = `
              #note-content-pdf { 
                background: #fff !important;
                color: #000 !important;
                font-family: Arial, sans-serif !important;
                line-height: 1.5 !important;
              }
              .print-only { display: block !important; }
              .hidden-pdf { display: none !important; }
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
      const filename = `${selectedNote.topic.replace(/\s+/g, '_')}_Notes.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-2">Smart <span className="text-indigo-600">Vault</span></h1>
        <p className="text-gray-500 font-medium italic">Your distilled intellectual assets, crystallized from Socratic dialogue.</p>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
        {/* Notes List */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vault..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-xs font-black uppercase tracking-widest">Unsealing Vault...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 opacity-30 italic">
                <p className="text-sm font-medium">No knowledge assets found.</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    "w-full p-5 text-left rounded-2xl transition-all border group relative",
                    selectedNote?.id === note.id 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "bg-white border-gray-50 hover:border-indigo-100 text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <StickyNote size={14} className={selectedNote?.id === note.id ? "text-indigo-200" : "text-indigo-500"} />
                    <span className={cn("text-[8px] font-black uppercase tracking-widest", selectedNote?.id === note.id ? "text-indigo-200" : "text-gray-400")}>
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold leading-snug line-clamp-2">{note.topic}</h3>
                  <ChevronRight size={14} className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 transition-all opacity-0 group-hover:opacity-100",
                    selectedNote?.id === note.id && "opacity-100"
                  )} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Note Content */}
        <div className="hidden lg:flex flex-1 bg-white border border-gray-100 rounded-[3rem] shadow-sm flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedNote ? (
              <motion.div 
                key={selectedNote.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <StickyNote size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-black text-gray-900">{selectedNote.topic}</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Crystallized on {new Date(selectedNote.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={downloadAsPDF}
                      disabled={isExportingPDF}
                      className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all border border-indigo-200 flex items-center gap-2"
                      title="Export PDF"
                    >
                      {isExportingPDF ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Download size={20} />
                      )}
                      <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Export PDF</span>
                    </button>
                    <button 
                      onClick={() => {
                        const element = document.createElement("a");
                        const file = new Blob([selectedNote.content], {type: 'text/markdown'});
                        element.href = URL.createObjectURL(file);
                        element.download = `${selectedNote.topic.replace(/\s+/g, '_')}_Notes.md`;
                        document.body.appendChild(element);
                        element.click();
                      }}
                      className="p-3 hover:bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-gray-100"
                      title="Export Markdown"
                    >
                      <FileText size={20} />
                    </button>
                    <button 
                      onClick={() => deleteNote(selectedNote.id)}
                      className="p-3 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100"
                      title="Purge from Vault"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12 scrollbar-thin bg-white">
                  <div id="note-content-pdf" className="prose prose-indigo max-w-none prose-headings:font-display prose-headings:font-black prose-p:font-medium prose-p:text-gray-600 p-4 bg-white">
                    <div className="mb-8 border-b border-gray-100 pb-8 no-pdf-title hidden print:block">
                       <h1 className="text-3xl font-display font-black text-gray-900">{selectedNote.topic}</h1>
                       <p className="text-sm text-gray-500">Crystallized on {new Date(selectedNote.created_at).toLocaleDateString()}</p>
                    </div>
                    <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                  <FileText size={48} className="text-gray-400" />
                </div>
                <p className="text-xl font-display font-bold text-gray-900">Select a memory module</p>
                <p className="text-sm font-medium mt-2">Crystallized notes will appear here for review.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
