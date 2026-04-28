'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Award, ShieldCheck, Download, Share2, Star, Printer, Link as LinkIcon, Copy, Check, Loader2, LogOut } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    userName: string;
    topic: string;
    score: number;
    date: string;
    id: string; // This should be the full UUID
    skills?: string[];
  };
}

export default function CertificateModal({ isOpen, onClose, data }: CertificateModalProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const shortId = data.id.slice(0, 8).toUpperCase();
  const certificateUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}/cert/${data.id}`
    : `https://studygenie.ai/cert/${data.id}`;
  const certificateRef = useRef<HTMLDivElement>(null);

  const skills = data.skills || [data.topic, 'Logical Reasoning', 'Inquiry-based Learning'];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);

    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, // High quality
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Remove any oklch color references that might break html2canvas
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            
            // Focus on common color properties
            const props = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'textDecorationColor', 'stopColor', 'fill', 'stroke'];
            
            props.forEach(prop => {
              const val = (el.style as any)[prop] || style.getPropertyValue(prop);
              if (val && val.includes('oklch')) {
                // Fallback to a safe color if oklch is detected
                if (prop === 'backgroundColor') (el.style as any)[prop] = '#ffffff';
                else if (prop === 'color') (el.style as any)[prop] = '#111827';
                else (el.style as any)[prop] = 'transparent';
              }
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`StudyGenie_Certificate_${data.topic.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      // Fallback to print if html2canvas fails
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(certificateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(certificateUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto print:p-0 print:static print:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-md print:hidden"
          />
          
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                display: flex !important;
                align-items: center;
                justify-content: center;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
              }
              @page {
                size: landscape;
                margin: 0;
              }
              .no-print {
                display: none !important;
              }
            }

            /* Force HEX colors for html2canvas compatibility (avoids oklch errors) */
            .print-container { background-color: #ffffff !important; color: #111827 !important; }
            .print-container .bg-white { background-color: #ffffff !important; }
            .print-container .text-white { color: #ffffff !important; }
            .print-container .bg-indigo-600 { background-color: #4f46e5 !important; }
            .print-container .text-indigo-600 { color: #4f46e5 !important; }
            .print-container .bg-indigo-50 { background-color: #f5f3ff !important; }
            .print-container .text-indigo-400 { color: #818cf8 !important; }
            .print-container .bg-amber-600 { background-color: #d97706 !important; }
            .print-container .text-amber-400 { color: #fbbf24 !important; }
            .print-container .fill-amber-400 { fill: #fbbf24 !important; }
            .print-container .bg-gray-900 { background-color: #111827 !important; }
            .print-container .text-gray-900 { color: #111827 !important; }
            .print-container .text-gray-700 { color: #374151 !important; }
            .print-container .text-gray-500 { color: #6b7280 !important; }
            .print-container .text-gray-400 { color: #9ca3af !important; }
            .print-container .bg-gray-50 { background-color: #f9fafb !important; }
            .print-container .border-gray-50 { border-color: #f3f4f6 !important; }
            .print-container .border-gray-100 { border-color: #f3f4f6 !important; }
            .print-container .border-gray-200 { border-color: #e5e7eb !important; }
            .print-container .text-green-500 { color: #22c55e !important; }
            
            /* Fallback for common slate colors if used */
            .print-container .bg-slate-50 { background-color: #f8fafc !important; }
            .print-container .text-slate-500 { color: #64748b !important; }
            .print-container .text-slate-400 { color: #94a3b8 !important; }

            /* Shadow overrides to avoid oklch in box-shadow */
            .print-container .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important; }
            .print-container .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important; }
            .print-container .shadow-indigo-100 { box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1) !important; }
            .print-container .shadow-gray-200 { box-shadow: 0 20px 25px -5px rgba(229, 231, 235, 0.5) !important; }
          `}</style>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row h-full md:h-auto max-h-[90vh] print-container"
          >
            {/* Direct Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-[110] p-3 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-400 hover:text-gray-900 rounded-full shadow-lg border border-gray-100 transition-all active:scale-95 no-print"
            >
              <X size={20} />
            </button>

            {/* The Actual Certificate */}
            <div 
              ref={certificateRef}
              className="flex-1 p-8 sm:p-12 bg-white relative overflow-hidden flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-gray-100 print:border-none print:w-full print:h-full"
            >
              {/* Resume Badge */}
              <div className="absolute top-6 left-6 rotate-[-15deg] z-20 print:top-12 print:left-12">
                 <div className="px-3 py-1 bg-gray-900 text-white rounded-lg flex items-center gap-1.5 shadow-xl shadow-gray-200">
                    <ShieldCheck size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Resume Verified</span>
                 </div>
              </div>

              {/* Decorative Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden print:opacity-[0.05]">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600 rounded-full blur-[100px]" />
              </div>
              
              <div className="relative z-10 border-8 border-double border-gray-100 p-8 sm:p-16 rounded-[2rem] w-full print:border-gray-200">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 rotate-3 print:shadow-none">
                    <Award size={44} />
                  </div>
                </div>

                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-8">Certificate of Mastery</h4>
                
                <p className="text-sm font-medium text-gray-500 mb-2 italic">This is to certify that</p>
                <h2 className="text-4xl sm:text-5xl font-display font-black text-gray-900 mb-8 tracking-tight">{data.userName}</h2>
                
                <p className="text-sm font-medium text-gray-500 mb-2 italic">has successfully achieved mastery in</p>
                <h3 className="text-2xl font-display font-bold text-indigo-600 mb-6 px-6 py-3 bg-indigo-50 inline-block rounded-xl print:bg-transparent">
                  {data.topic}
                </h3>

                {/* Skill Tags */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                   {skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-lg border border-gray-100 uppercase tracking-widest">
                        {skill}
                      </span>
                   ))}
                </div>

                <div className="flex justify-center gap-16 items-end mb-12">
                   <div className="text-left">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">Proficiency</p>
                      <p className="text-3xl font-display font-black text-gray-900">{data.score}%</p>
                   </div>
                   <div className="text-left">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">Date Issued</p>
                      <p className="text-xl font-display font-bold text-gray-700">{data.date}</p>
                   </div>
                </div>

                <div className="flex items-center justify-center gap-3 mb-4">
                   <ShieldCheck size={24} className="text-green-500" />
                   <span className="text-sm font-bold text-gray-900">StudyGenie AI Verified Logic</span>
                </div>
                <p className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">ID: {shortId}</p>

                {/* QR Code for print */}
                <div className="hidden print:flex flex-col items-center mt-12 opacity-50">
                  <QRCodeSVG value={certificateUrl} size={60} />
                  <p className="mt-2 text-[8px] font-bold text-gray-400">Scan to Verify</p>
                </div>
              </div>
            </div>

            {/* Verification Sidebar (Hidden on Print) */}
            <div className="w-full md:w-72 bg-gray-50 p-8 flex flex-col no-print">
              <div className="flex justify-between items-center md:items-end mb-8">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verification</h5>
                 <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 md:hidden">
                    <X size={24} />
                 </button>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex justify-center">
                 <QRCodeSVG value={certificateUrl} size={120} />
              </div>

              <p className="text-[10px] font-bold text-gray-500 text-center mb-8 leading-relaxed">
                Scan this code to verify the authenticity of this certificate.
              </p>

              <div className="mb-8 p-3 bg-white rounded-xl border border-gray-100">
                <p className="text-[8px] font-black uppercase text-gray-400 mb-2 tracking-widest">Public Link</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 truncate text-[10px] font-mono text-gray-500">{certificateUrl}</div>
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-gray-50 rounded-md text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </button>
                <button 
                  onClick={shareToLinkedIn}
                  className="w-full py-4 bg-[#0077B5] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#006097] transition-all active:scale-95 shadow-lg shadow-blue-100"
                >
                  <Share2 size={18} />
                  Share to LinkedIn
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-white text-gray-900 border border-gray-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                >
                  <LogOut size={18} className="rotate-180" />
                  Exit Certificate
                </button>
              </div>
              
              <button 
                onClick={onClose}
                className="hidden md:flex mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors mx-auto"
              >
                Close Certificate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
