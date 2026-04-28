'use client';

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, MessageSquare, ShieldCheck, Zap, MessageCircle, Linkedin, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;

    setIsSubmitting(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          { 
            name: formData.name, 
            email: formData.email, 
            message: formData.message,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white/80 backdrop-blur-md border-b px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-display font-black tracking-tight text-slate-900 italic">STUDYGENIE AI</span>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/tutor" className="text-slate-500 hover:text-indigo-600 font-bold text-sm uppercase tracking-widest transition-colors">Tutor</Link>
          <Link href="#how-it-works" className="text-slate-500 hover:text-indigo-600 font-bold text-sm uppercase tracking-widest transition-colors">Process</Link>
          <Link href="#contact" className="text-slate-500 hover:text-indigo-600 font-bold text-sm uppercase tracking-widest transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/signup" className="hidden sm:block">
            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95">
              Get Started
            </button>
          </Link>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-6 flex flex-col gap-6 md:hidden shadow-xl"
          >
            <Link 
              href="/tutor" 
              className="text-slate-600 font-bold text-lg uppercase tracking-widest"
              onClick={() => setIsMenuOpen(false)}
            >
              Tutor
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-slate-600 font-bold text-lg uppercase tracking-widest"
              onClick={() => setIsMenuOpen(false)}
            >
              Process
            </Link>
            <Link 
              href="#contact" 
              className="text-slate-600 font-bold text-lg uppercase tracking-widest"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
              <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">
                Get Started
              </button>
            </Link>
          </motion.div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="px-6 pt-8 pb-20 lg:pt-20 lg:pb-40 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-6 lg:mb-8">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.2em]">Future of Learning</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-display font-black text-slate-900 leading-[1] lg:leading-[0.9] tracking-tighter mb-6 lg:mb-8">
              StudyGenie <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 font-medium leading-relaxed max-w-xl mb-10 lg:mb-12">
              The first cognitive learning engine that understands your intent. Skip the noise, focus on core principles, and achieve verified mastery through Socratic dialogue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <button className="w-full sm:w-auto bg-indigo-600 text-white px-8 lg:px-10 py-4 lg:py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95 lg:text-lg">
                  Start Learning <MessageSquare className="w-5 h-5" />
                </button>
              </Link>
              <Link href="#how-it-works">
                <button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 px-8 lg:px-10 py-4 lg:py-5 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 lg:text-lg">
                  How It Works
                </button>
              </Link>
            </div>

            <div className="mt-12 lg:mt-16 flex flex-wrap items-center gap-6 lg:gap-8 opacity-40 grayscale">
              <div className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-400">Trusted By</div>
              <div className="flex flex-wrap gap-4 lg:gap-8">
                <span className="font-display font-bold text-base lg:text-lg italic">ACADEMIA</span>
                <span className="font-display font-bold text-base lg:text-lg italic">TECHCORP</span>
                <span className="font-display font-bold text-base lg:text-lg italic">EDULABS</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative lg:mt-32 lg:max-w-md lg:ml-auto w-full"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <div className="aspect-[4/5] sm:aspect-square bg-slate-100 rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden shadow-2xl relative p-3 lg:p-4 border border-slate-100">
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-transparent z-10" />
               <Image 
                src="https://picsum.photos/seed/library/1200/1200" 
                alt="Educational Research" 
                fill
                priority
                className="object-cover rounded-[2rem] lg:rounded-[2.5rem]"
                referrerPolicy="no-referrer"
               />
               
               {/* Decorative elements */}
               <div className="absolute top-6 right-6 lg:top-10 lg:right-10 w-16 h-16 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-xl rounded-2xl lg:rounded-[2rem] z-20 flex items-center justify-center border border-white/30">
                  <Zap className="text-white w-6 h-6 lg:w-10 lg:h-10 drop-shadow-lg" />
               </div>
            </div>
            
            {/* Status Card */}
            <motion.div 
              className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 lg:-bottom-12 lg:-right-12 bg-white p-4 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-3xl flex items-center gap-4 lg:gap-6 border border-slate-100"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-100 text-green-600 rounded-xl lg:rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-green-50">
                <ShieldCheck className="w-6 h-6 lg:w-8 lg:h-8" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Status</p>
                <p className="text-base lg:text-xl font-display font-black text-slate-900 leading-none">Identity <br/>Verified</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50/50 py-20 lg:py-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 lg:mb-20">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl lg:text-6xl font-display font-black text-slate-900 leading-tight tracking-tighter">Accelerate your <br/><span className="text-indigo-600">Neural Efficiency</span></h2>
                <p className="text-slate-500 font-medium mt-4 lg:mt-6 text-base lg:text-lg">Our methodology is built on top of cognitive load theory and the Socratic method.</p>
              </div>
              <div className="hidden lg:flex items-center gap-4 text-slate-400 font-black uppercase text-[10px] tracking-widest pb-2">
                <span>View Methodology</span>
                <BookOpen size={16} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                { icon: <MessageSquare />, title: "Socratic Tutor", desc: "Engage in deep, intent-based dialogue that guides you to answers rather than just giving them." },
                { icon: <BookOpen />, title: "Explain-Back", desc: "Verify your understanding by explaining concepts back to the AI, which identifies your cognitive gaps." },
                { icon: <GraduationCap />, title: "Verified Mastery", desc: "Earn certificates of completion backed by a documented history of your conceptual understanding." }
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="bg-white p-8 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 lg:p-8 text-slate-50/50 -rotate-12 transform group-hover:rotate-0 transition-transform">
                    {React.cloneElement(feature.icon as React.ReactElement<{ size: number }>, { size: 100 })}
                  </div>
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 lg:mb-8 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-indigo-200 transition-all relative z-10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl lg:text-2xl font-display font-black text-slate-900 mb-3 lg:mb-4 relative z-10">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium relative z-10 text-sm lg:text-base">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        {/* Mastery Showcase Section */}
        <section className="py-20 lg:py-32 px-6 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="aspect-[4/3] lg:aspect-square rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-slate-50">
                  <Image 
                    src="https://picsum.photos/seed/intelligence/1200/1200"
                    alt="Cognitive Learning"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay" />
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -top-6 -right-6 lg:-top-10 lg:-right-10 bg-indigo-600 text-white p-6 lg:p-8 rounded-full shadow-2xl animate-pulse pointer-events-none z-10">
                  <div className="text-center">
                    <span className="block text-2xl lg:text-3xl font-black">98%</span>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Retention</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-6 font-display font-black text-indigo-600 uppercase text-[10px] tracking-[0.2em]">
                  Scientific Foundation
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-6xl font-display font-black text-slate-900 leading-tight tracking-tighter mb-6">
                  Engineered for the <span className="text-indigo-600">Modern Mind</span>
                </h2>
                <div className="space-y-6 text-slate-500 font-medium text-lg leading-relaxed">
                  <p>
                    StudyGenie AI isn&apos;t just another chatbot. It&apos;s a cognitive architecture designed to mirror the way experts synthesize complex information into usable knowledge.
                  </p>
                  <p>
                    By utilizing <span className="text-slate-900 font-bold italic underline decoration-indigo-200">Spaced Repetition</span> and <span className="text-slate-900 font-bold italic underline decoration-indigo-200">Active Recall</span> patterns, we ensure that your learning moves beyond passive reading.
                  </p>
                  <ul className="space-y-4 pt-4">
                    {[
                      "Dynamic Cognitive Mapping",
                      "Socratic Dialogue Trees",
                      "Neural Feedback Loops"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-900 font-bold text-base lg:text-lg">
                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <Zap size={14} className="fill-indigo-600" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 lg:py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 lg:mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 tracking-tight mb-4">How It Works</h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">A data-driven approach to cognitive mastery.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: "01", title: "State Intent", desc: "Tell StudyGenie what you want to learn or the problem you're solving." },
                { step: "02", title: "Guided Dialogue", desc: "Engage in a Socratic session designed to build your mental model." },
                { step: "03", title: "Explain & Verify", desc: "Complete the cycle by explaining the concept back to verify clarity." },
                { step: "04", title: "Earn Verity", desc: "Download your certificate of mastery once your gaps are closed." }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-8 bg-slate-50 rounded-[2rem] border border-slate-100"
                >
                  <span className="text-4xl font-display font-black text-indigo-100 absolute top-4 right-6">{item.step}</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{item.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed relative z-10">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-slate-900 py-20 lg:py-32 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/5 -skew-x-12 transform translate-x-20" />
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-20 items-center relative z-10">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-display font-black text-white leading-tight tracking-tighter mb-6 lg:mb-8 text-center lg:text-left">Get in touch <br/><span className="text-indigo-400">with the builder</span></h2>
              <p className="text-slate-400 text-base lg:text-lg font-medium mb-10 lg:mb-12 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                Have questions or feedback? Connect with the developer directly or send a query below.
              </p>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-6 justify-center lg:justify-start">
                <a href="https://discord.com" target="_blank" className="flex items-center gap-4 text-white hover:text-indigo-400 transition-colors group">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-all shrink-0">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Discord</p>
                    <p className="font-bold">toheedahmed0_79396</p>
                  </div>
                </a>
                
                <a href="https://www.linkedin.com/in/toheed-ahmed-7aa7162b4" target="_blank" className="flex items-center gap-4 text-white hover:text-indigo-400 transition-colors group">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-all shrink-0">
                    <Linkedin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">LinkedIn</p>
                    <p className="font-bold">Toheed Ahmed</p>
                  </div>
                </a>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-6 sm:p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl w-full border border-slate-100"
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-2xl font-display font-black text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-slate-500 font-medium mb-8">We&apos;ve received your query and will get back to you soon.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form className="space-y-4 lg:space-y-6" onSubmit={handleSubmit}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm" 
                        placeholder="Your Name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email</label>
                      <input 
                        type="email" 
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm" 
                        placeholder="you@example.com" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message</label>
                    <textarea 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium h-32 text-sm" 
                      placeholder="Tell us more..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white p-4 lg:p-5 rounded-[1.5rem] lg:rounded-[2rem] font-black uppercase tracking-widest text-xs lg:text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-slate-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-display font-black tracking-tight text-slate-900 italic">STUDYGENIE AI</span>
            </div>
            
            <p className="text-slate-400 text-sm font-medium">
              &copy; 2024 StudyGenie AI. All rights reserved.
            </p>

            <div className="flex gap-8 text-slate-400 text-sm font-medium">
              <Link href="#" className="hover:text-indigo-600 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Terms</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
