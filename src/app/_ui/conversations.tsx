"use client";

// Хранилище чатов: держит список диалогов, активный чат и сохраняет всё
// в localStorage. Провайдер поднят в layout, поэтому и сайдбар (история),
// и страница чата работают с одним источником данных.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const STORAGE_KEY = "ozonologist.conversations.v1";

function createConversation(): Conversation {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    title: "Новый чат",
    messages: [],
    updatedAt: Date.now(),
  };
}

export function makeTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 40 ? clean.slice(0, 40) + "…" : clean;
}

interface ConversationsValue {
  conversations: Conversation[];
  sortedConversations: Conversation[];
  currentId: string;
  current: Conversation | undefined;
  hydrated: boolean;
  newChat: () => string;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  updateConversation: (id: string, patch: Partial<Conversation>) => void;
}

const ConversationsContext = createContext<ConversationsValue | null>(null);

export function ConversationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Загрузка истории из localStorage при старте.
  useEffect(() => {
    let loaded: Conversation[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch {
      loaded = [];
    }
    if (!Array.isArray(loaded) || loaded.length === 0) {
      loaded = [createConversation()];
    }
    setConversations(loaded);
    setCurrentId(loaded[0].id);
    setHydrated(true);
  }, []);

  // Сохранение истории при любом изменении.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      /* приватный режим / переполнение — молча игнорируем */
    }
  }, [conversations, hydrated]);

  // Если активный чат исчез (удалён) — переключаемся на первый доступный.
  useEffect(() => {
    if (!hydrated || conversations.length === 0) return;
    if (!conversations.some((c) => c.id === currentId)) {
      setCurrentId(conversations[0].id);
    }
  }, [conversations, currentId, hydrated]);

  const current = conversations.find((c) => c.id === currentId);

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations]
  );

  const value = useMemo<ConversationsValue>(() => {
    function updateConversation(id: string, patch: Partial<Conversation>) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    }

    function newChat(): string {
      // Если пустой чат уже есть — просто переключаемся на него.
      const empty = conversations.find((c) => c.messages.length === 0);
      if (empty) {
        setCurrentId(empty.id);
        return empty.id;
      }
      const conv = createConversation();
      setConversations((prev) => [conv, ...prev]);
      setCurrentId(conv.id);
      return conv.id;
    }

    function selectChat(id: string) {
      setCurrentId(id);
    }

    function deleteChat(id: string) {
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== id);
        return rest.length ? rest : [createConversation()];
      });
    }

    return {
      conversations,
      sortedConversations,
      currentId,
      current,
      hydrated,
      newChat,
      selectChat,
      deleteChat,
      updateConversation,
    };
  }, [conversations, sortedConversations, currentId, current, hydrated]);

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations(): ConversationsValue {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error("useConversations must be used within ConversationsProvider");
  }
  return ctx;
}
