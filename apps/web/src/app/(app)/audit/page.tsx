"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listAuditLogs } from "@/lib/audit-api";
import { formatDateTimeMn } from "@/lib/utils";

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["audit", { action, actorEmail, page }],
    queryFn: () =>
      listAuditLogs({
        action: action || undefined,
        actorEmail: actorEmail || undefined,
        page,
        pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Аудит лог
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Системд хийгдсэн бүх үйлдлийн түүх
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Үйлдэл (жишээ: patient.create)"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="max-w-xs"
          />
          <Input
            placeholder="Имэйлээр шүүх"
            value={actorEmail}
            onChange={(e) => { setActorEmail(e.target.value); setPage(1); }}
            className="max-w-xs"
          />
          {data ? (
            <span className="text-sm text-muted-foreground ml-auto">
              Нийт: {data.total}
            </span>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Огноо</th>
                <th>Хэрэглэгч</th>
                <th>Үйлдэл</th>
                <th>Resource</th>
                <th>ID</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-muted-foreground">
                      {formatDateTimeMn(log.createdAt)}
                    </td>
                    <td>{log.actorEmail ?? "—"}</td>
                    <td className="font-mono text-xs">{log.action}</td>
                    <td className="text-xs">{log.resource ?? "—"}</td>
                    <td className="text-xs font-mono text-muted-foreground">
                      {log.resourceId ?? "—"}
                    </td>
                    <td className="text-xs font-mono">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Лог олдсонгүй
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 ? (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-muted-foreground">
              Хуудас {data.page}/{totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
