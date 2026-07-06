import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, ApiClientError } from '../api/client';
import type { SessionDto, SessionSummaryDto } from '../api/contracts';

interface SessionState {
  sessionId: string | null;
  isOpen: boolean;
  openedAt: string | null;
  lastClosedSummary: SessionSummaryDto | null;
  hydrateSession: () => Promise<void>;
  openSession: (openingAmount?: number) => Promise<void>;
  closeSession: () => Promise<SessionSummaryDto | null>;
  clearLastClosedSummary: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      isOpen: false,
      openedAt: null,
      lastClosedSummary: null,
      hydrateSession: async () => {
        try {
          const session = await api<SessionDto>('/api/sessions/active');
          set({
            sessionId: String(session.id),
            isOpen: true,
            openedAt: session.openedAt,
            lastClosedSummary: null,
          });
        } catch (cause) {
          if (cause instanceof ApiClientError && cause.status === 422) {
            set({ sessionId: null, isOpen: false, openedAt: null });
            return;
          }
          throw cause;
        }
      },
      openSession: async (openingAmount = 0) => {
        const session = await api<SessionDto>('/api/sessions/open', {
          method: 'POST',
          body: JSON.stringify({ openingAmount }),
        });
        set({
          sessionId: String(session.id),
          isOpen: true,
          openedAt: session.openedAt,
          lastClosedSummary: null,
        });
      },
      closeSession: async () => {
        const sessionId = get().sessionId;
        if (!sessionId) return null;
        const summary = await api<SessionSummaryDto>(`/api/sessions/${sessionId}/close`, {
          method: 'POST',
        });
        set({
          sessionId: null,
          isOpen: false,
          openedAt: null,
          lastClosedSummary: summary,
        });
        return summary;
      },
      clearLastClosedSummary: () => set({ lastClosedSummary: null }),
    }),
    { name: 'cafe-etoile-session', version: 2 }
  )
);
