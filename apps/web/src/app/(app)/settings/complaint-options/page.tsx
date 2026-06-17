"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Loader2, Stethoscope } from "lucide-react";
import type { ComplaintOption } from "@his/shared";
import { ROLES } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGuard } from "@/components/auth-guard";
import {
  getComplaintOptions,
  createComplaintOption,
  deleteComplaintOption,
} from "@/lib/complaints-api";

/* ─── One category panel ─────────────────────────────────────────── */

function OptionsPanel({
  title,
  category,
  items,
  onAddMany,
  onDelete,
  adding,
  deleting,
}: {
  title: string;
  category: "complaint" | "location";
  items: ComplaintOption[];
  onAddMany: (category: "complaint" | "location", names: string[]) => void;
  onDelete: (id: string) => void;
  adding: boolean;
  deleting: string | null;
}) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    onAddMany(category, lines);
    setText("");
  };

  const lineCount = text.split("\n").filter((l) => l.trim()).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing options */}
        <div className="divide-y divide-border rounded-md border border-border overflow-hidden max-h-72 overflow-y-auto">
          {items.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Сонголт байхгүй байна
            </div>
          )}
          {items.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center justify-between px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm">{opt.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => onDelete(opt.id)}
                disabled={deleting === opt.id}
              >
                {deleting === opt.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Bulk add textarea */}
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={"Нэг мөрт нэг сонголт бичнэ үү\nЖишээ нь:\nТолгой өвдөнө\nЯдарч сульдана"}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {lineCount > 0 ? `${lineCount} мөр нэмэгдэнэ` : ""}
            </span>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={adding || lineCount === 0}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Нэмэх
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function ComplaintOptionsPage() {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["complaint-options"],
    queryFn: getComplaintOptions,
  });

  const addMutation = useMutation({
    mutationFn: async (data: { category: "complaint" | "location"; names: string[] }) => {
      for (const name of data.names) {
        await createComplaintOption({ category: data.category, name });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaint-options"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      await deleteComplaintOption(id);
    },
    onSettled: () => setDeletingId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaint-options"] }),
  });

  const complaints = options.filter((o) => o.category === "complaint");
  const locations  = options.filter((o) => o.category === "location");

  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Зовуурийн сонголтууд
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Нэг мөрт нэг сонголт бичих буюу paste хийгээд Нэмэх дарна
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <OptionsPanel
              title="Зовуурийн сонголт"
              category="complaint"
              items={complaints}
              onAddMany={(cat, names) => addMutation.mutate({ category: cat, names })}
              onDelete={(id) => deleteMutation.mutate(id)}
              adding={addMutation.isPending}
              deleting={deletingId}
            />
            <OptionsPanel
              title="Байрлалын сонголт"
              category="location"
              items={locations}
              onAddMany={(cat, names) => addMutation.mutate({ category: cat, names })}
              onDelete={(id) => deleteMutation.mutate(id)}
              adding={addMutation.isPending}
              deleting={deletingId}
            />
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
