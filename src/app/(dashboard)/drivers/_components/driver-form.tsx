"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, Download } from "lucide-react";
import { ModalForm, FormField, FormInput, FormSelect, FormActions } from "@/components/ui/modal-form";
import { createDriver, updateDriver } from "@/app/actions/driver";

interface DriverFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editDriver?: {
    id: string;
    name: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiry: Date;
    contactNumber: string;
  } | null;
}

const LICENSE_CATEGORIES = ["LMV", "HMV", "HGV", "PSV", "Transport", "HPMV"];

interface Credentials {
  email: string;
  temporaryPassword: string;
  driverName: string;
}

function CredentialsDialog({
  credentials,
  driverName,
  onClose,
}: {
  credentials: Credentials;
  driverName: string;
  onClose: () => void;
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const copy = async (text: string, type: "email" | "pass") => {
    await navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const downloadCredentials = () => {
    const content = [
      "TransitOps — Driver Login Credentials",
      "=====================================",
      "",
      `Driver Name : ${driverName}`,
      `Login Email : ${credentials.email}`,
      `Password    : ${credentials.temporaryPassword}`,
      "",
      "⚠  Please change your password after the first login.",
      "",
      `Generated on: ${new Date().toLocaleString()}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transitops-driver-credentials-${driverName.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ModalForm open={true} onOpenChange={() => {}} title="Driver Account Created" description="Share these credentials with the driver to log in.">
      <div className="space-y-4">
        {/* Success banner */}
        <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
            Account successfully created for <strong>{driverName}</strong>
          </p>
        </div>

        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Login Email</p>
              <p className="font-mono text-sm mt-0.5" style={{ color: "var(--fg)" }}>{credentials.email}</p>
            </div>
            <button
              onClick={() => copy(credentials.email, "email")}
              className="p-2 rounded-lg transition-colors hover:bg-slate-700"
              style={{ color: "var(--fg-muted)" }}
            >
              {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="border-t" style={{ borderColor: "var(--border)" }} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Temporary Password</p>
              <p className="font-mono text-sm mt-0.5" style={{ color: "var(--fg)" }}>{credentials.temporaryPassword}</p>
            </div>
            <button
              onClick={() => copy(credentials.temporaryPassword, "pass")}
              className="p-2 rounded-lg transition-colors hover:bg-slate-700"
              style={{ color: "var(--fg-muted)" }}
            >
              {copiedPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
          ⚠ The driver should change their password after the first login.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={downloadCredentials}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-slate-700"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            <Download className="w-4 h-4" />
            Download .txt
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold text-white gradient-brand"
          >
            Done
          </button>
        </div>
      </div>
    </ModalForm>
  );
}

export function DriverForm({ open, onOpenChange, editDriver }: DriverFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const isEdit = !!editDriver;

  // Format date for input
  const defaultExpiry = editDriver?.licenseExpiry
    ? new Date(editDriver.licenseExpiry).toISOString().split("T")[0]
    : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (isEdit) {
        await updateDriver(editDriver.id, formData);
        toast.success("Driver updated successfully");
        onOpenChange(false);
        router.refresh();
      } else {
        const driverName = formData.get("name") as string;
        const result = await createDriver(formData);
        if (result.success) {
          setCredentials({ email: result.email, temporaryPassword: result.temporaryPassword, driverName });
          onOpenChange(false);
          router.refresh();
        }
      }
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ModalForm
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? "Edit Driver" : "Register New Driver"}
        description={isEdit ? "Update driver profile." : "Add a driver — a login account will be auto-created."}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name">
            <FormInput
              name="name"
              placeholder="e.g., Ravi Kumar"
              required
              defaultValue={editDriver?.name}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="License Number">
              <FormInput
                name="licenseNumber"
                placeholder="e.g., MH-0119850001234"
                required
                defaultValue={editDriver?.licenseNumber}
              />
            </FormField>
            <FormField label="License Category">
              <FormSelect name="licenseCategory" required defaultValue={editDriver?.licenseCategory ?? ""}>
                <option value="" disabled>Select...</option>
                {LICENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormSelect>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="License Expiry">
              <FormInput
                name="licenseExpiry"
                type="date"
                required
                defaultValue={defaultExpiry}
              />
            </FormField>
            <FormField label="Contact Number">
              <FormInput
                name="contactNumber"
                placeholder="e.g., +91 9876543210"
                required
                defaultValue={editDriver?.contactNumber}
              />
            </FormField>
          </div>

          {!isEdit && (
            <div className="rounded-lg p-3 text-xs" style={{ background: "var(--bg)", color: "var(--fg-muted)" }}>
              🔐 A login account with email <strong>name.driver@transitops.com</strong> and temp password <strong>driver123</strong> will be automatically created.
            </div>
          )}

          <FormActions
            onCancel={() => onOpenChange(false)}
            loading={loading}
            submitLabel={isEdit ? "Update Driver" : "Register Driver"}
          />
        </form>
      </ModalForm>

      {credentials && (
        <CredentialsDialog
          credentials={credentials}
          driverName={credentials.driverName}
          onClose={() => setCredentials(null)}
        />
      )}
    </>
  );
}
