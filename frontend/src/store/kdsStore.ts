import { create } from 'zustand';
import { api } from '../api/client';
import type { KdsTicketDto } from '../api/contracts';

export type KDSStage = 'to_cook' | 'preparing' | 'completed';

export interface KDSItem {
  id: string;
  name: string;
  qty: number;
  done: boolean;
  categoryId?: string;
}

export interface KDSTicket {
  id: string;
  orderNum: string;
  tableLabel: string;
  employeeId: string;
  stage: KDSStage;
  items: KDSItem[];
  createdAt: number;
}

interface KDSState {
  tickets: KDSTicket[];
  loading: boolean;
  hydrate: () => Promise<void>;
  advanceStage: (id: string) => Promise<void>;
  markItemDone: (ticketId: string, itemId: string) => Promise<void>;
  reset: () => void;
  getTicketByOrder: (orderNum: string) => KDSTicket | undefined;
}

const fromDto = (ticket: KdsTicketDto): KDSTicket => ({
  id: String(ticket.orderId),
  orderNum: ticket.orderNumber,
  tableLabel: ticket.tableNumber ?? 'Takeaway',
  employeeId: String(ticket.employeeId),
  stage: ticket.stage.toLowerCase() as KDSStage,
  createdAt: new Date(ticket.createdAt).getTime(),
  items: ticket.items.map((item) => ({
    id: String(item.id),
    name: item.productName,
    qty: Number(item.quantity),
    done: item.status === 'COMPLETED',
  })),
});

export const useKDSStore = create<KDSState>((set, get) => ({
  tickets: [],
  loading: false,
  hydrate: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const tickets = await api<KdsTicketDto[]>('/api/kds/tickets');
      set({ tickets: tickets.map(fromDto), loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  advanceStage: async (id) => {
    const ticket = await api<KdsTicketDto>(`/api/kds/tickets/${id}/advance`, {
      method: 'PUT',
    });
    set((state) => ({
      tickets: state.tickets.map((item) => (item.id === id ? fromDto(ticket) : item)),
    }));
  },
  markItemDone: async (ticketId, itemId) => {
    const ticket = await api<KdsTicketDto>(
      `/api/kds/tickets/${ticketId}/items/${itemId}/done`,
      { method: 'PUT' }
    );
    set((state) => ({
      tickets: state.tickets.map((item) =>
        item.id === ticketId ? fromDto(ticket) : item
      ),
    }));
  },
  reset: () => set({ tickets: [] }),
  getTicketByOrder: (orderNum) => get().tickets.find((t) => t.orderNum === orderNum),
}));
