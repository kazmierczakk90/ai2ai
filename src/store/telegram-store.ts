import { create } from "zustand";
import type { TelegramMessage } from "@/store/telegram-types";
import {
  fetchTelegramMessages,
  fetchTelegramStatus,
  retagTelegramMessage,
} from "@/lib/api";

export type { TelegramMessage } from "@/store/telegram-types";

export type WebhookStatus = {
  connector_linked: boolean;
  webhook_active: boolean;
  last_ping: string | null;
  errors: number;
  messages: number;
};

type State = {
  messages: TelegramMessage[];
  selectedChatId: number | null;
  status: WebhookStatus | null;
  polling: boolean;
  lastUpdateId: number;
  select: (id: number) => void;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  retag: (updateId: number) => Promise<void>;
};

let timer: ReturnType<typeof setInterval> | null = null;

export const useTelegramStore = create<State>((set, get) => ({
  messages: [],
  selectedChatId: null,
  status: null,
  polling: false,
  lastUpdateId: 0,

  select: (id) => set({ selectedChatId: id }),

  refresh: async () => {
    const [msgRes, status] = await Promise.all([
      fetchTelegramMessages(get().lastUpdateId),
      fetchTelegramStatus(),
    ]);
    set((s) => {
      const merged = [...s.messages];
      const seen = new Set(merged.map((m) => m.update_id));
      for (const m of msgRes.messages) {
        if (!seen.has(m.update_id)) merged.push(m);
      }
      const last = merged.reduce(
        (max, m) => (m.update_id > max ? m.update_id : max),
        s.lastUpdateId,
      );
      const selected =
        s.selectedChatId ?? (merged[0]?.chat_id ?? null);
      return {
        messages: merged,
        status,
        lastUpdateId: last,
        selectedChatId: selected,
      };
    });
  },

  startPolling: () => {
    if (get().polling) return;
    set({ polling: true });
    void get().refresh();
    timer = setInterval(() => {
      void get().refresh();
    }, 3000);
  },

  stopPolling: () => {
    if (timer) clearInterval(timer);
    timer = null;
    set({ polling: false });
  },

  retag: async (updateId) => {
    const res = await retagTelegramMessage(updateId);
    set((s) => ({
      messages: s.messages.map((m) =>
        m.update_id === updateId ? { ...m, tokens: res.tokens } : m,
      ),
    }));
  },
}));
