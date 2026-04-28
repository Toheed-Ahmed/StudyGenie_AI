'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { Award, ShieldCheck, Loader2, Star, Download, Printer, Share2, Copy, Check, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PublicCertificatePage() {
  const { id } = useParams();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const { data, error } = await supabase
          .from('tutor_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data.is_mastered) throw new Error("Certificate not found or topic not yet mastered.");
        
        setSession(data);
      } catch (err: any) {
        console.error("Public fetch error:", err);
        setError(err.message || "Failed to load certificate.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCertificate();
  }, [id]);

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
      pdf.save(`StudyGenie_AI_Certificate_${session.title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-display font-black text-gray-900 mb-4">Invalid Certificate</h2>
        <p className="text-gray-500 mb-8 max-w-sm">{error || "The certificate ID provided does not exist or hasn't reached mastery yet."}</p>
        <Link href="/" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100">
          Return Home
        </Link>
      </div>
    );
  }

  const certificateUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center py-12 px-4 sm:px-6 relative">
      <Link 
        href="/dashboard"
        className="fixed top-6 left-6 z-[100] no-print px-4 py-2 bg-white text-gray-900 rounded-xl font-bold shadow-xl border border-gray-100 flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95 group"
      >
        <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={16} />
        Back to Dashboard
      </Link>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .certificate-paper, .certificate-paper * { visibility: visible; }
          .certificate-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex !important;
            align-items: center;
            justify-content: center;
            background: white !important;
          }
          .no-print { display: none !important; }
          @page { size: landscape; margin: 0; }
        }

        /* Force HEX colors for html2canvas compatibility (avoids oklch errors) */
        .certificate-paper { background-color: #ffffff !important; color: #111827 !important; }
        .certificate-paper .bg-white { background-color: #ffffff !important; }
        .certificate-paper .text-white { color: #ffffff !important; }
        .certificate-paper .bg-indigo-600 { background-color: #4f46e5 !important; }
        .certificate-paper .text-indigo-600 { color: #4f46e5 !important; }
        .certificate-paper .bg-indigo-50 { background-color: #f5f3ff !important; }
        .certificate-paper .text-indigo-400 { color: #818cf8 !important; }
        .certificate-paper .bg-amber-600 { background-color: #d97706 !important; }
        .certificate-paper .text-amber-400 { color: #fbbf24 !important; }
        .certificate-paper .fill-amber-400 { fill: #fbbf24 !important; }
        .certificate-paper .bg-gray-900 { background-color: #111827 !important; }
        .certificate-paper .text-gray-900 { color: #111827 !important; }
        .certificate-paper .text-gray-700 { color: #374151 !important; }
        .certificate-paper .text-gray-500 { color: #6b7280 !important; }
        .certificate-paper .text-gray-400 { color: #9ca3af !important; }
        .certificate-paper .bg-gray-50 { background-color: #f9fafb !important; }
        .certificate-paper .border-gray-50 { border-color: #f3f4f6 !important; }
        .certificate-paper .border-gray-100 { border-color: #f3f4f6 !important; }
        .certificate-paper .text-green-500 { color: #22c55e !important; }
        
        /* Fallback for common slate colors if used */
        .certificate-paper .bg-slate-50 { background-color: #f8fafc !important; }
        .certificate-paper .text-slate-500 { color: #64748b !important; }
        .certificate-paper .text-slate-400 { color: #94a3b8 !important; }
        
        /* Shadow overrides to avoid oklch in box-shadow */
        .certificate-paper .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important; }
        .certificate-paper .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important; }
        .certificate-paper .shadow-indigo-100 { box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1) !important; }
        .certificate-paper .shadow-gray-300 { box-shadow: 0 20px 25px -5px rgba(209, 213, 219, 0.3) !important; }
      `}</style>

      {/* Brand Header */}
      <div className="mb-12 flex items-center gap-3 no-print">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">S</div>
        <h1 className="text-xl font-display font-black text-gray-900 tracking-tight">StudyGenie AI Verified</h1>
      </div>

      {/* Certificate Paper */}
      <motion.div
        ref={certificateRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 sm:p-20 relative overflow-hidden certificate-paper mb-12"
      >
        {/* Resume Badge */}
        <div className="absolute top-10 left-10 rotate-[-15deg] z-20 print:top-16 print:left-16">
            <div className="px-6 py-2 bg-gray-900 text-white rounded-xl flex items-center gap-2 shadow-2xl shadow-gray-300">
              <ShieldCheck size={20} className="text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-widest">Resume Verified</span>
            </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden print:opacity-[0.05]">
          <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-indigo-600 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-amber-600 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 border-[12px] border-double border-gray-50 p-10 sm:p-20 rounded-[2.5rem] w-full text-center print:border-gray-100">
          <div className="flex justify-center mb-10">
            <div className="w-24 h-24 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-100 rotate-3 print:shadow-none">
              <Award size={56} />
            </div>
          </div>

          <h4 className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 mb-10">Verification of Cognitive Mastery</h4>
          
          <p className="text-lg font-medium text-gray-500 mb-2 italic">This digital record confirms that</p>
          <h2 className="text-4xl sm:text-6xl font-display font-black text-gray-900 mb-10 tracking-tight">
            {session.user_name || "Expert Scholar"}
          </h2>
          
          <p className="text-lg font-medium text-gray-500 mb-4 italic">has demonstrated an advanced understanding of</p>
          <h3 className="text-3xl sm:text-4xl font-display font-bold text-indigo-600 mb-6 px-8 py-4 bg-indigo-50 inline-block rounded-2xl print:bg-transparent">
            {session.title}
          </h3>

          {/* Skill Tags */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[session.title, 'Logical Reasoning', 'Inquiry-based Learning', 'Mastery Achievement'].map((skill, i) => (
              <span key={i} className="px-5 py-2 bg-gray-50 text-xs font-bold text-gray-400 rounded-xl border border-gray-100 uppercase tracking-widest">
                {skill}
              </span>
            ))}
          </div>

          <div className="flex justify-center gap-20 items-end mb-16">
             <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 leading-none">Proficiency Level</p>
                <div className="flex items-center gap-3">
                   <p className="text-4xl font-display font-black text-gray-900">{session.mastery_score || 85}%</p>
                   <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-amber-400 fill-amber-400" />)}
                   </div>
                </div>
             </div>
             <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 leading-none">Record of Issue</p>
                <p className="text-2xl font-display font-bold text-gray-700">{new Date(session.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
             </div>
          </div>

          <div className="flex flex-col items-center gap-4">
             <div className="flex items-center gap-3">
                <ShieldCheck size={28} className="text-green-500" />
                <span className="text-lg font-bold text-gray-900">StudyGenie AI Verified Logic Engine</span>
             </div>
             <p className="text-xs font-mono text-gray-400 uppercase tracking-[0.3em]">Block ID: {session.id.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* QR Code for verification */}
          <div className="mt-16 flex flex-col items-center opacity-70">
            <QRCodeSVG value={certificateUrl} size={80} />
            <p className="mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Scan to Verify Record</p>
          </div>
        </div>
      </motion.div>

      {/* Floating Actions */}
      <div className="flex flex-wrap justify-center gap-4 no-print">
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-bold shadow-2xl flex items-center gap-3 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
        <button 
          onClick={handlePrint}
          className="px-10 py-5 bg-white text-gray-900 rounded-[2rem] font-bold shadow-xl border border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-all active:scale-95"
        >
          <Printer size={20} />
          Print Record
        </button>
        <button 
          onClick={shareToLinkedIn}
          className="px-10 py-5 bg-[#0077B5] text-white rounded-[2rem] font-bold shadow-2xl flex items-center gap-3 hover:bg-[#006097] transition-all active:scale-95"
        >
          <Share2 size={20} />
          Share on LinkedIn
        </button>
        <button 
          onClick={copyToClipboard}
          className="px-10 py-5 bg-white text-gray-900 rounded-[2rem] font-bold shadow-xl border border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-all active:scale-95 min-w-[180px] justify-center"
        >
          {copied ? (
            <>
              <Check size={20} className="text-green-500" />
              Copied Link
            </>
          ) : (
            <>
              <Copy size={20} />
              Copy Link
            </>
          )}
        </button>
      </div>

      <p className="mt-12 text-[10px] font-black text-gray-400 uppercase tracking-widest no-print">
        © {new Date().getFullYear()} StudyGenie AI • Secure Learning Protocol
      </p>
    </div>
  );
}
