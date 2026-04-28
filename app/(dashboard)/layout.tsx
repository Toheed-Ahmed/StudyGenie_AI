'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  GraduationCap, 
  Home, 
  LayoutDashboard, 
  LogOut, 
  MessageSquare, 
  Settings, 
  User,
  ChevronLeft,
  Menu,
  Sparkles,
  FileText,
  StickyNote,
  Calendar,
  History,
  Trophy,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'AI Tutor', href: '/tutor' },
  { icon: Sparkles, label: 'AI Quiz', href: '/quiz' },
  { icon: FileText, label: 'AI Exam', href: '/exam' },
  { icon: StickyNote, label: 'Smart Notes', href: '/notes' },
  { icon: Calendar, label: 'Planner', href: '/planner' },
  { icon: GraduationCap, label: 'Certificates', href: '/certificates' },
  { icon: History, label: 'History', href: '/history' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Users, label: 'Study Squads', href: '/teams' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();

  // Optimizing re-renders by memoizing the nav list
  const navList = useMemo(() => {
    return NAV_ITEMS.map((item) => {
      const isActive = pathname === item.href;
      return (
        <Link 
          key={item.href} 
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
            isActive 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
          onClick={() => setIsMobileOpen(false)}
        >
          <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
          {!isCollapsed && (
            <span className="font-medium whitespace-nowrap">
              {item.label}
            </span>
          )}
          {isActive && (
            <motion.div 
              layoutId="nav-pill"
              className="absolute inset-0 bg-indigo-600 rounded-xl -z-10"
              transition={{ type: "spring", bounce: 0, duration: 0.15 }}
            />
          )}
        </Link>
      );
    });
  }, [pathname, isCollapsed]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col bg-white border-r transition-all duration-200 ease-in-out relative z-40",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-6 flex items-center gap-3 h-20 border-b border-transparent">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
            <GraduationCap className="w-6 h-6 shrink-0" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display font-black text-xl tracking-tight text-slate-900 uppercase italic"
            >
              StudyGenie AI
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-6">
          {navList}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => signOut()}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors group",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 bg-white border rounded-full p-1 shadow-sm hover:bg-slate-50 transition-colors z-50 hidden lg:block"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform duration-150", isCollapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header - Visible on all screens */}
        <header className="h-16 lg:h-20 bg-white border-b flex items-center justify-between px-4 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors border shadow-sm"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-display font-black text-lg tracking-tight uppercase italic">StudyGenie AI</span>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                {NAV_ITEMS.find(item => item.href === pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 font-medium">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm text-slate-900">Study Session</span>
                <span className="text-[10px] text-green-500 uppercase font-bold">Active</span>
             </div>
             <div className="w-8 h-8 lg:w-10 lg:h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border ring-4 ring-slate-50">
                <User size={18} />
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-[1600px] mx-auto p-4 lg:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.15 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-[70] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 h-20 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                    <GraduationCap className="w-6 h-6 shrink-0" />
                  </div>
                  <span className="font-display font-black text-xl tracking-tight text-slate-900 uppercase italic">StudyGenie AI</span>
                </div>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium",
                        isActive 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t">
                <button 
                  onClick={() => {
                    setIsMobileOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
