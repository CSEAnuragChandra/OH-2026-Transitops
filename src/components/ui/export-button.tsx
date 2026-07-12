"use client";

import Papa from "papaparse";
import { Download } from "lucide-react";

interface ExportButtonProps {
  data: object[];
  filename: string;
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const handleExport = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      id={`export-${filename}`}
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-slate-800"
      style={{
        borderColor: "var(--border)",
        color: "var(--fg-muted)",
        background: "var(--bg-card)",
      }}
    >
      <Download className="w-3.5 h-3.5" />
      Export CSV
    </button>
  );
}
