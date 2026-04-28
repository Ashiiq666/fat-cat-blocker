import { AnimatePresence, motion } from "framer-motion";

export type ToastItem = { id: number; text: string; emoji?: string };

export function Toasts({ items }: { items: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-6 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="rounded-full bg-cocoa/90 px-4 py-2 text-sm font-bold text-cream shadow-soft backdrop-blur"
          >
            {t.emoji && <span className="mr-2">{t.emoji}</span>}
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
