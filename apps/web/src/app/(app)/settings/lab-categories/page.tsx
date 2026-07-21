"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Pencil, Trash2, Loader2, FlaskConical, Search,
  ToggleLeft, ToggleRight, ShieldCheck,
} from "lucide-react";
import type { LabCategoryDef } from "@his/shared";
import { ROLES } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth-guard";
import {
  listLabCategories, createLabCategory, updateLabCategory, deleteLabCategory,
} from "@/lib/lab-categories-api";
import { extractApiError } from "@/lib/api";

interface FormState {
  key: string;
  name: string;
  nameEn: string;
  sortOrder: string;
}

const EMPTY: FormState = { key: "", name: "", nameEn: "", sortOrder: "" };

/* ─── Add / edit form ───────────────────────────────────────────────── */
function CategoryForm({
  initial,
  keyEditable,
  onSave,
  onCancel,
  isPending,
}: {
  initial: FormState;
  keyEditable: boolean;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [f, setF] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Түлхүүр (key) *</Label>
        <Input
          value={f.key}
          onChange={(e) => set("key", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
          placeholder="allergy_tests"
          disabled={!keyEditable}
          className="font-mono"
        />
        {!keyEditable && (
          <p className="text-[11px] text-muted-foreground">Үүсгэсний дараа key өөрчлөгдөхгүй.</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Нэр (МН) *</Label>
        <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Харшлын шинжилгээ" />
      </div>
      <div className="space-y-1.5">
        <Label>Нэр (EN)</Label>
        <Input value={f.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Allergy tests" />
      </div>
      <div className="space-y-1.5">
        <Label>Эрэмбэ</Label>
        <Input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} placeholder="0" />
      </div>
      <div className="sm:col-span-2 flex gap-2 pt-2 border-t border-border">
        <Button disabled={!f.key || !f.name || isPending} onClick={() => onSave(f)}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Хадгалах
        </Button>
        <Button variant="ghost" onClick={onCancel}>Болих</Button>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
function LabCategoriesPageInner() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<LabCategoryDef | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["lab-categories-admin"],
    queryFn: () => listLabCategories(true),
  });

  const create = useMutation({
    mutationFn: (f: FormState) =>
      createLabCategory({
        key: f.key.trim(),
        name: f.name.trim(),
        nameEn: f.nameEn.trim() || undefined,
        sortOrder: f.sortOrder ? parseInt(f.sortOrder, 10) : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Ангилал нэмэгдлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-categories-admin"] });
      qc.invalidateQueries({ queryKey: ["lab-categories"] });
      setShowForm(false);
    },
    onError: (e) => toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      updateLabCategory(id, {
        name: f.name.trim(),
        nameEn: f.nameEn.trim() || undefined,
        sortOrder: f.sortOrder ? parseInt(f.sortOrder, 10) : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Ангилал шинэчлэгдлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-categories-admin"] });
      qc.invalidateQueries({ queryKey: ["lab-categories"] });
      setEditing(null);
    },
    onError: (e) => toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateLabCategory(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab-categories-admin"] });
      qc.invalidateQueries({ queryKey: ["lab-categories"] });
    },
    onError: (e) => toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { setDeletingId(id); await deleteLabCategory(id); },
    onSuccess: () => {
      toast({ title: "Ангилал устгагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-categories-admin"] });
      qc.invalidateQueries({ queryKey: ["lab-categories"] });
    },
    onError: (e) => toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
    onSettled: () => setDeletingId(null),
  });

  const catToForm = (c: LabCategoryDef): FormState => ({
    key: c.key, name: c.name, nameEn: c.nameEn ?? "", sortOrder: String(c.sortOrder ?? 0),
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? categories.filter((c) => c.name.toLowerCase().includes(q) || c.key.toLowerCase().includes(q))
    : categories;
  const sorted = [...filtered].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const handleDelete = (c: LabCategoryDef) => {
    if (confirm(`"${c.name}" ангиллыг устгах уу?`)) remove.mutate(c.id);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-violet-600" />
            Шинжилгээний ангилал
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Лабораторийн шинжилгээний каталогийн ангиллуудыг удирдах
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); }}>
          <Plus className="h-4 w-4" />
          Ангилал нэмэх
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Шинэ ангилал нэмэх</CardTitle></CardHeader>
          <CardContent>
            <CategoryForm
              initial={EMPTY}
              keyEditable
              onSave={(f) => create.mutate(f)}
              onCancel={() => setShowForm(false)}
              isPending={create.isPending}
            />
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Хайх..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {sorted.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Ангилал олдсонгүй</div>
            )}
            {sorted.map((c) => (
              <div key={c.id}>
                {editing?.id === c.id ? (
                  <div className="p-5">
                    <CategoryForm
                      initial={catToForm(c)}
                      keyEditable={false}
                      onSave={(f) => update.mutate({ id: c.id, f })}
                      onCancel={() => setEditing(null)}
                      isPending={update.isPending}
                    />
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 px-5 py-3 ${!c.isActive ? "opacity-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{c.name}</span>
                        {c.nameEn && <span className="text-xs text-muted-foreground">{c.nameEn}</span>}
                        {c.isDefault && (
                          <Badge tone="info" className="text-[10px] gap-1">
                            <ShieldCheck className="h-3 w-3" /> Систем
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{c.key}</div>
                    </div>
                    <Badge tone={c.isActive ? "success" : "muted"} className="shrink-0">
                      {c.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                    </Badge>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => toggleActive.mutate({ id: c.id, isActive: !c.isActive })}
                        disabled={toggleActive.isPending}
                        title={c.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                      >
                        {c.isActive
                          ? <ToggleRight className="h-4 w-4 text-emerald-600" />
                          : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setShowForm(false); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(c)}
                        disabled={c.isDefault || deletingId === c.id}
                        title={c.isDefault ? "Системийн ангилал устгах боломжгүй" : "Устгах"}
                      >
                        {deletingId === c.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function LabCategoriesPage() {
  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN]}>
      <LabCategoriesPageInner />
    </AuthGuard>
  );
}
