"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, ChevronDown, ChevronUp, GripVertical,
  Loader2, Save, Settings2, X, Check,
} from "lucide-react";
import type {
  EmrTabConfig, EmrSectionConfig, EmrFieldConfig, EmrFieldType,
} from "@his/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { getEmrTemplate, updateEmrTemplate } from "@/lib/emr-template-api";
import { extractApiError } from "@/lib/api";

/* ─── helpers ───────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 10);

const FIELD_TYPE_LABELS: Record<EmrFieldType, string> = {
  text:     "Текст",
  textarea: "Урт текст",
  select:   "Dropdown сонголт",
  number:   "Тоо",
  radio:    "Radio сонголт",
  checkbox: "Checkbox",
};

const SEL = "h-8 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

/* ─── Field editor ──────────────────────────────────────────────── */
function FieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: EmrFieldConfig;
  onChange: (f: EmrFieldConfig) => void;
  onDelete: () => void;
}) {
  const [optInput, setOptInput] = useState("");

  const addOption = () => {
    const v = optInput.trim();
    if (!v) return;
    onChange({ ...field, options: [...(field.options ?? []), v] });
    setOptInput("");
  };

  const removeOption = (i: number) =>
    onChange({ ...field, options: (field.options ?? []).filter((_, idx) => idx !== i) });

  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-white">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Нэр (label)</Label>
            <Input
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              className="h-8 text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Төрөл</Label>
            <select
              value={field.type}
              onChange={(e) => onChange({ ...field, type: e.target.value as EmrFieldType })}
              className={`${SEL} w-full mt-1`}
            >
              {(Object.entries(FIELD_TYPE_LABELS) as [EmrFieldType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive mt-5 shrink-0">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Unit + Placeholder */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Нэгж (unit)</Label>
          <Input
            value={field.unit ?? ""}
            onChange={(e) => onChange({ ...field, unit: e.target.value })}
            className="h-8 text-sm mt-1" placeholder="жш: мг, ° C"
          />
        </div>
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
            className="h-8 text-sm mt-1"
          />
        </div>
      </div>

      {/* Required */}
      <label className="flex items-center gap-2 text-xs cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={field.required ?? false}
          onChange={(e) => onChange({ ...field, required: e.target.checked })}
          className="rounded"
        />
        Заавал бөглөх
      </label>

      {/* Options for select / radio / checkbox */}
      {["select", "radio", "checkbox"].includes(field.type) && (
        <div className="space-y-2">
          <Label className="text-xs">Сонголтууд</Label>
          <div className="flex flex-wrap gap-1 mb-1">
            {(field.options ?? []).map((opt, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                {opt}
                <button onClick={() => removeOption(i)}><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={optInput}
              onChange={(e) => setOptInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
              placeholder="Сонголт нэмэх..."
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" variant="outline" onClick={addOption}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Section editor ────────────────────────────────────────────── */
function SectionEditor({
  section,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  section: EmrSectionConfig;
  onChange: (s: EmrSectionConfig) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(section.name);

  const addField = () =>
    onChange({
      ...section,
      fields: [
        ...(section.fields ?? []),
        { id: uid(), label: "Шинэ талбар", type: "text", options: [], required: false, unit: "", placeholder: "" },
      ],
    });

  const updateField = (idx: number, f: EmrFieldConfig) =>
    onChange({ ...section, fields: section.fields.map((x, i) => (i === idx ? f : x)) });

  const deleteField = (idx: number) =>
    onChange({ ...section, fields: section.fields.filter((_, i) => i !== idx) });

  const saveName = () => {
    onChange({ ...section, name: nameVal.trim() || section.name });
    setEditName(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/20">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            disabled={isFirst}
            onClick={onMoveUp}
            className="text-muted-foreground disabled:opacity-30 hover:text-foreground"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            disabled={isLast}
            onClick={onMoveDown}
            className="text-muted-foreground disabled:opacity-30 hover:text-foreground"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Name */}
        <div className="flex-1">
          {editName ? (
            <div className="flex items-center gap-1">
              <Input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditName(false); }}
                className="h-7 text-sm"
                autoFocus
              />
              <button onClick={saveName} className="text-emerald-600"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditName(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button
              onClick={() => { setEditName(true); setNameVal(section.name); }}
              className="text-sm font-medium text-left hover:text-primary"
            >
              {section.name}
            </button>
          )}
        </div>

        {/* Type badge */}
        <Badge tone={section.type === "vitals" ? "primary" : "muted"} className="text-[10px] shrink-0">
          {section.type === "vitals" ? "Амин үзүүлэлт" : "Custom"}
        </Badge>

        {/* Type toggle */}
        {section.type !== "vitals" && (
          <select
            value={section.type}
            onChange={(e) => onChange({ ...section, type: e.target.value as any })}
            className={`${SEL} w-28 shrink-0`}
          >
            <option value="custom">Custom</option>
            <option value="vitals">Амин үзүүлэлт</option>
          </select>
        )}

        {/* Expand / Delete */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      {open && (
        <div className="p-3 space-y-3 bg-slate-50/50">
          {section.type === "vitals" ? (
            <p className="text-xs text-muted-foreground italic">
              Энэ section нь амин үзүүлэлтийн module-ийг автоматаар харуулна.
            </p>
          ) : (
            <>
              {section.fields.length === 0 && (
                <p className="text-xs text-muted-foreground">Талбар нэмэгдээгүй байна.</p>
              )}
              {section.fields.map((f, i) => (
                <FieldEditor
                  key={f.id}
                  field={f}
                  onChange={(nf) => updateField(i, nf)}
                  onDelete={() => deleteField(i)}
                />
              ))}
              <Button size="sm" variant="outline" onClick={addField} className="w-full">
                <Plus className="h-3.5 w-3.5" /> Талбар нэмэх
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Tab editor ────────────────────────────────────────────────── */
function TabEditor({
  tab,
  onChange,
  onDelete,
  isOnly,
}: {
  tab: EmrTabConfig;
  onChange: (t: EmrTabConfig) => void;
  onDelete: () => void;
  isOnly: boolean;
}) {
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(tab.name);

  const addSection = () =>
    onChange({
      ...tab,
      sections: [
        ...(tab.sections ?? []),
        { id: uid(), name: "Шинэ бүлэг", order: (tab.sections?.length ?? 0), type: "custom", fields: [] },
      ],
    });

  const updateSection = (idx: number, s: EmrSectionConfig) =>
    onChange({ ...tab, sections: tab.sections.map((x, i) => (i === idx ? s : x)) });

  const deleteSection = (idx: number) =>
    onChange({ ...tab, sections: tab.sections.filter((_, i) => i !== idx) });

  const moveSection = (idx: number, dir: -1 | 1) => {
    const arr = [...tab.sections];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange({ ...tab, sections: arr.map((s, i) => ({ ...s, order: i })) });
  };

  const saveName = () => {
    onChange({ ...tab, name: nameVal.trim() || tab.name });
    setEditName(false);
  };

  return (
    <Card>
      <CardHeader className="py-3 px-5 border-b border-border flex-row items-center gap-3">
        {editName ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditName(false); }}
              className="h-8 text-sm font-semibold"
              autoFocus
            />
            <button onClick={saveName} className="text-emerald-600"><Check className="h-4 w-4" /></button>
            <button onClick={() => setEditName(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <button
            onClick={() => { setEditName(true); setNameVal(tab.name); }}
            className="text-base font-semibold flex-1 text-left hover:text-primary"
          >
            {tab.name}
          </button>
        )}
        {!isOnly && (
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {tab.sections.map((s, i) => (
          <SectionEditor
            key={s.id}
            section={s}
            onChange={(ns) => updateSection(i, ns)}
            onDelete={() => deleteSection(i)}
            onMoveUp={() => moveSection(i, -1)}
            onMoveDown={() => moveSection(i, 1)}
            isFirst={i === 0}
            isLast={i === tab.sections.length - 1}
          />
        ))}
        <Button variant="outline" size="sm" onClick={addSection} className="w-full border-dashed">
          <Plus className="h-3.5 w-3.5" /> Section нэмэх
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function EmrTemplatePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const { data: tmpl, isLoading } = useQuery({
    queryKey: ["emr-template"],
    queryFn:  getEmrTemplate,
  });

  const [tabs, setTabs] = useState<EmrTabConfig[] | null>(null);
  // Use loaded data as initial state (once)
  const localTabs: EmrTabConfig[] = tabs ?? tmpl?.tabs ?? [];

  const mutation = useMutation({
    mutationFn: () => updateEmrTemplate(localTabs),
    onSuccess: () => {
      toast({ title: "Загвар хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["emr-template"] });
      setTabs(null); // reset local
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const setLocalTabs = useCallback((t: EmrTabConfig[]) => setTabs(t), []);

  const addTab = () =>
    setLocalTabs([
      ...localTabs,
      { id: uid(), name: "Шинэ таб", order: localTabs.length, sections: [] },
    ]);

  const updateTab = (idx: number, t: EmrTabConfig) =>
    setLocalTabs(localTabs.map((x, i) => (i === idx ? t : x)));

  const deleteTab = (idx: number) =>
    setLocalTabs(localTabs.filter((_, i) => i !== idx));

  const isDirty = tabs !== null;

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Зөвхөн администратор тохируулах боломжтой.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Үзлэгийн загвар тохируулах
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Үзлэгийн картанд харагдах tab, section, талбаруудыг тохируулна.
            Tab 1 (Үзлэгийн мэдээлэл) нь тогтмол бөгөөд өөрчлөгдөхгүй.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={!isDirty || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Хадгалах
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Fixed Tab 1 hint */}
          <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground bg-muted/10">
            <strong>Tab 1 — Үзлэгийн мэдээлэл</strong>
            <span className="ml-2 opacity-70">(Зовиур, шинж тэмдэг, онош, эмчилгээ, эмийн жор) — тогтмол, засагдахгүй</span>
          </div>

          {/* Configurable tabs */}
          {localTabs.map((tab, i) => (
            <TabEditor
              key={tab.id}
              tab={tab}
              onChange={(t) => updateTab(i, t)}
              onDelete={() => deleteTab(i)}
              isOnly={localTabs.length === 1}
            />
          ))}

          {/* Add tab */}
          <Button variant="outline" onClick={addTab} className="w-full border-dashed">
            <Plus className="h-4 w-4" /> Шинэ таб нэмэх
          </Button>
        </>
      )}
    </div>
  );
}
