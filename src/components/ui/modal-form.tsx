"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ModalForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalFormProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-2xl focus:outline-none",
                  className
                )}
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <Dialog.Title
                      className="text-lg font-bold"
                      style={{ color: "var(--fg)" }}
                    >
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description
                        className="text-sm mt-0.5"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <button
                      className="rounded-lg p-1.5 transition-colors hover:bg-slate-700"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </div>

                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// Form field helpers
export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

export function FormInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        className
      )}
      style={{
        background: "var(--bg)",
        borderColor: "var(--border)",
        color: "var(--fg)",
      }}
      {...props}
    />
  );
}

export function FormSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        className
      )}
      style={{
        background: "var(--bg)",
        borderColor: "var(--border)",
        color: "var(--fg)",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormActions({
  onCancel,
  loading,
  submitLabel = "Save",
}: {
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-700"
        style={{ color: "var(--fg-muted)" }}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 rounded-lg text-sm font-semibold text-white gradient-brand transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
