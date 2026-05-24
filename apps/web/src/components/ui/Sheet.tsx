import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SheetProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({ open, onOpenChange, title, description, children, footer }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.aside
                className={cn(
                  'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-card',
                )}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                aria-describedby={undefined}
              >
                <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
                    {description ? (
                      <Dialog.Description className="text-sm text-ink-muted">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  <Dialog.Close
                    aria-label="Close"
                    className="rounded p-1.5 hover:bg-surface-muted"
                  >
                    <X className="h-5 w-5 text-ink-subtle" />
                  </Dialog.Close>
                </header>
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer ? (
                  <footer className="border-t border-slate-100 bg-surface-muted px-5 py-4">
                    {footer}
                  </footer>
                ) : null}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
