'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveSession {
  id: string;
  title: string;
  mastery_score?: number;
}

interface SessionContextType {
  activeSession: ActiveSession | null;
  setActiveSession: (session: ActiveSession | null) => void;
}

const SessionContext = createContext<SessionContextType>({
  activeSession: null,
  setActiveSession: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  return (
    <SessionContext.Provider value={{ activeSession, setActiveSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  return context;
}
