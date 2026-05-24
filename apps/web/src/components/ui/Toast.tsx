import * as ToastPrimitive from '@radix-ui/react-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { create } from 'zustand';
import { cn } from '@/lib/cn';

type ToastEntry = {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'error' | 'info';
};

type ToastStore = {
  items: ToastEntry[];
  push(t: Omit<ToastEntry, 'id'>): void;
  dismiss(id: string): void;
};

const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (t) =>
    set((s) => ({
      items: [...s.items, { ...t, id: Math.random().toString(36).slice(2) }],
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function useToast() {
  return {
    success: (title: string, description?: string) =>
      useToastStore.getState().push({ title, description, tone: 'success' }),
    error: (title: string, description?: string) =>
      useToastStore.getState().push({ title, description, tone: 'error' }),
    info: (title: string, description?: string) =>
      useToastStore.getState().push({ title, description, tone: 'info' }),
  };
}

export function ToastViewport() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
      <AnimatePresence>
        {items.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            asChild
            forceMount
          >
            <motion.li
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={cn(
                'card-surface flex items-start gap-3 p-3 pr-2 min-w-[260px] max-w-[360px]',
              )}
            >
              {t.tone === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : t.tone === 'error' ? (
                <XCircle className="h-5 w-5 shrink-0 text-danger" />
              ) : null}
              <div className="flex-1">
                <ToastPrimitive.Title className="text-sm font-semibold text-ink">
                  {t.title}
                </ToastPrimitive.Title>
                {t.description ? (
                  <ToastPrimitive.Description className="text-xs text-ink-muted">
                    {t.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                aria-label="Dismiss"
                className="rounded p-1 hover:bg-surface-muted"
              >
                <X className="h-4 w-4 text-ink-subtle" />
              </ToastPrimitive.Close>
            </motion.li>
          </ToastPrimitive.Root>
        ))}
      </AnimatePresence>
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}
