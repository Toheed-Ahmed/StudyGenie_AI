import Link from 'next/link';
import { motion } from 'motion/react';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4 text-center selection:bg-indigo-100 font-sans">
      <div className="max-w-md">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-8">
          <AlertCircle size={40} className="text-indigo-600" />
        </div>
        
        <h1 className="text-4xl font-display font-black text-gray-900 mb-4 tracking-tight leading-none">
          Page Not <span className="text-indigo-600">Found</span>
        </h1>
        
        <p className="text-gray-500 font-medium leading-relaxed mb-10">
          The concept you&apos;re looking for doesn&apos;t exist in this knowledge graph. Let&apos;s get you back to your learning path.
        </p>

        <Link 
          href="/"
          className="inline-flex items-center gap-3 h-14 px-8 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 group"
        >
          <Home size={20} className="group-hover:-translate-y-0.5 transition-transform" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
