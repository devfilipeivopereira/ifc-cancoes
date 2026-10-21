import { useEffect } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function FilterSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fechar filtros" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-card shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
      >
        <div className="px-4 pt-3">
          <div className="mx-auto h-1.5 w-12 rounded-full" style={{ background: "var(--border)" }} />
          <div className="mt-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">{title}</h2>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
        <div className="mt-2 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </motion.div>
    </div>
  );
}
