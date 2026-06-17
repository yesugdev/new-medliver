"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Loader2, Stethoscope } from "lucide-react";
import type { ComplaintOption } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  onAdd,
  onDelete,
  adding,
  deleting,
}: {
  title: string;
  category: "complaint" | "location";
  items: ComplaintOption[];
  onAdd: (category: "complaint" | "location", name: string) => void;
  onDelete: (id: string) => void;
  adding: boolean;
  deleting: string | null;
}) {
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(category, trimmed);
    setNewName("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing options */}
        <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
          {items.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Сонголт байхгүй байна</div>
          )}
          {items.map((opt) => (
            <div key={opt.id} className="flex items-center justify-between px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors">
              <span className="text-sm">{opt.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
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

        {/* Add new */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Шинэ сонголт нэмэх..."
            className="flex-1 h-9 rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button size="sm" onClick={handleAdd} disabled={adding || !newName.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Нэмэх
          </Button>
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
    mutationFn: (data: { category: "complaint" | "location"; name: string }) =>
      createComplaintOption(data),
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
            Зовуурь болон байрлалын dropdown сонголтуудыг удирдах
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
            onAdd={(cat, name) => addMutation.mutate({ category: cat, name })}
            onDelete={(id) => deleteMutation.mutate(id)}
            adding={addMutation.isPending}
            deleting={deletingId}
          />
          <OptionsPanel
            title="Байрлалын сонголт"
            category="location"
            items={locations}
            onAdd={(cat, name) => addMutation.mutate({ category: cat, name })}
            onDelete={(id) => deleteMutation.mutate(id)}
            adding={addMutation.isPending}
            deleting={deletingId}
          />
        </div>
      )}
    </div>
  );
}
