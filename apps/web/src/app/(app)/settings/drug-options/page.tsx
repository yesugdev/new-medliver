"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Loader2, SlidersHorizontal } from "lucide-react";
import type { DrugOption, DrugOptionType } from "@his/shared";
import { ROLES } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGuard } from "@/components/auth-guard";
import { getDrugOptions, createDrugOption, deleteDrugOption } from "@/lib/drug-options-api";

function OptionsPanel({
  title,
  type,
  items,
  onAddMany,
  onDelete,
  adding,
  deleting,
}: {
  title: string;
  type: DrugOptionType;
  items: DrugOption[];
  onAddMany: (type: DrugOptionType, names: string[]) => void;
  onDelete: (id: string) => void;
  adding: boolean;
  deleting: string | null;
}) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    onAddMany(type, lines);
    setText("");
  };

  const lineCount = text.split("\n").filter((l) => l.trim()).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="divide-y divide-border rounded-md border border-border overflow-hidden max-h-72 overflow-y-auto">
          {items.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Сонголт байхгүй байна</div>
          )}
          {items.map((opt) => (
            <div key={opt.id} className="flex items-center justify-between px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors">
              <span className="text-sm">{opt.name}</span>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => onDelete(opt.id)}
                disabled={deleting === opt.id}
              >
                {deleting === opt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={"Нэг мөрт нэг сонголт бичнэ үү\nЖишээ нь:\nMonos\nТэвэн фарм"}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{lineCount > 0 ? `${lineCount} мөр нэмэгдэнэ` : ""}</span>
            <Button size="sm" onClick={handleAdd} disabled={adding || lineCount === 0}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Нэмэх
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DrugOptionsPage() {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["drug-options"],
    queryFn: getDrugOptions,
  });

  const addMutation = useMutation({
    mutationFn: async (data: { type: DrugOptionType; names: string[] }) => {
      for (const name of data.names) {
        await createDrugOption({ type: data.type, name });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drug-options"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      await deleteDrugOption(id);
    },
    onSettled: () => setDeletingId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drug-options"] }),
  });

  const manufacturers = options.filter((o) => o.type === "manufacturer");
  const categories    = options.filter((o) => o.type === "category");

  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.RECEPTION]}>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/drugs"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Эмийн сонголтууд
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Үйлдвэрлэгч, ангилалын dropdown сонголтуудыг тохируулах
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
              title="Үйлдвэрлэгч"
              type="manufacturer"
              items={manufacturers}
              onAddMany={(t, names) => addMutation.mutate({ type: t, names })}
              onDelete={(id) => deleteMutation.mutate(id)}
              adding={addMutation.isPending}
              deleting={deletingId}
            />
            <OptionsPanel
              title="Ангилал"
              type="category"
              items={categories}
              onAddMany={(t, names) => addMutation.mutate({ type: t, names })}
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
