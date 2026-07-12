"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { ModalForm } from "@/components/ui/modal-form";
import { changeDriverPassword } from "@/app/actions/driver-auth";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const current = (form.elements.namedItem("currentPassword") as HTMLInputElement).value;
    const newPwd = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    if (newPwd !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPwd.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await changeDriverPassword(current, newPwd);
      toast.success("Password changed successfully! Please log in again.");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Change Password"
      description="Enter your current password and choose a new one."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          label="Current Password"
          name="currentPassword"
          show={showCurrent}
          onToggle={() => setShowCurrent((p) => !p)}
          placeholder="Your current password"
        />
        <PasswordField
          label="New Password"
          name="newPassword"
          show={showNew}
          onToggle={() => setShowNew((p) => !p)}
          placeholder="Min. 6 characters"
        />
        <PasswordField
          label="Confirm New Password"
          name="confirmPassword"
          show={showConfirm}
          onToggle={() => setShowConfirm((p) => !p)}
          placeholder="Repeat new password"
        />

        <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-700"
            style={{ color: "var(--fg-muted)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white gradient-brand transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </ModalForm>
  );
}

function PasswordField({
  label,
  name,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  name: string;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          required
          className="w-full rounded-lg border px-3 py-2.5 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-blue-400"
          style={{ color: "var(--fg-muted)" }}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
