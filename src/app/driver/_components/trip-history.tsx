"use client";

import { useState } from "react";
import { History, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface TripHistoryItem {
  id: string;
  code: string;
  source: string;
  destination: string;
  plannedDistance: number;
  cargoWeight: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle: { name: string; registrationNumber: string } | null;
}

const PAGE_SIZE = 5;

export function TripHistory({ trips }: { trips: TripHistoryItem[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(trips.length / PAGE_SIZE);
  const visible = trips.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (trips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Trip History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>
            No completed trips yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Trip History
          </CardTitle>
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {trips.length} trip{trips.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {visible.map((trip) => (
            <div
              key={trip.id}
              className="px-5 py-4 flex items-start justify-between gap-3 hover:brightness-110 transition-all"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--brand-500)" }}>
                    {trip.code}
                  </span>
                  <Badge variant="success" className="text-xs">COMPLETED</Badge>
                </div>
                <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
                  {trip.source}
                  <span className="mx-1.5 text-slate-500">→</span>
                  {trip.destination}
                </p>
                {trip.vehicle && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>
                    {trip.vehicle.name} · {trip.vehicle.registrationNumber}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold" style={{ color: "var(--fg)" }}>
                  {trip.plannedDistance} km
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  {formatDate(trip.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-slate-700 disabled:opacity-40"
              style={{ color: "var(--fg-muted)" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-slate-700 disabled:opacity-40"
              style={{ color: "var(--fg-muted)" }}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
