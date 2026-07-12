"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { ChangePasswordDialog } from "./change-password-dialog";

export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:border-blue-500/50 hover:text-blue-400"
        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
        title="Change Password"
      >
        <Lock className="w-3.5 h-3.5" />
        Change Password
      </button>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
