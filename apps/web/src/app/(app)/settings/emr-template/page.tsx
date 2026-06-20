"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  Loader2, Save, Settings2, X, Check, GripVertical,
  FileText, AlertCircle, Scissors,
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
  text:      "Текст",
  textarea:  "Урт текст",
  select:    "Dropdown",
  number:    "Тоо",
  radio:     "Radio",
  checkbox:  "Checkbox",
  separator: "Тусгаарлах текст",
};

/* ─── FieldEditor ────────────────────────────────────────────────── */
function FieldEditor({
  field,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  field: EmrFieldConfig;
  onChange: (f: EmrFieldConfig) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [optInput, setOptInput] = useState("");

  const addOpt = () => {
    const v = optInput.trim();
    if (!v) return;
    onChange({ ...field, options: [...(field.options ?? []), v] });
    setOptInput("");
  };

  // Зайгаар тусгаарласан үг бүрийг тус тусдаа сонголт болгон нэмэх
  const addOptSplit = () => {
    const parts = optInput.split(/\s+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    onChange({ ...field, options: [...(field.options ?? []), ...parts] });
    setOptInput("");
  };

  const removeOpt = (i: number) =>
    onChange({ ...field, options: (field.options ?? []).filter((_, idx) => idx !== i) });

  const hasOptions = ["select", "radio", "checkbox"].includes(field.type);

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">
      {/* Field header row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button disabled={isFirst} onClick={onMoveUp}
            className="text-muted-foreground disabled:opacity-25 hover:text-foreground">
            <ChevronUp className="h-3 w-3" />
          </button>
          <button disabled={isLast} onClick={onMoveDown}
            className="text-muted-foreground disabled:opacity-25 hover:text-foreground">
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <span className="flex-1 text-xs font-medium truncate">{field.label || "—"}</span>
        <Badge tone="muted" className="text-[10px] shrink-0">
          {FIELD_TYPE_LABELS[field.type]}
        </Badge>
        {field.required && (
          <Badge tone="destructive" className="text-[10px] shrink-0">Заавал</Badge>
        )}
        <button onClick={onDelete}
          className="text-muted-foreground hover:text-destructive shrink-0 ml-1">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Field body */}
      <div className="p-3 space-y-3">
        {/* Label + Type — always shown */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs mb-1 block">
              {field.type === "separator" ? "Тусгаарлах текст" : "Нэр (label)"}
            </Label>
            <Input
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              className="h-8 text-sm"
              placeholder={field.type === "separator" ? "Гарчиг текст..." : "Талбарын нэр"}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Төрөл</Label>
            <select
              value={field.type}
              onChange={(e) => {
                const newType = e.target.value as EmrFieldType;
                const keepsOptions = ["select", "radio", "checkbox"].includes(newType);
                onChange({
                  ...field,
                  type: newType,
                  options: keepsOptions ? (field.options ?? []) : [],
                });
              }}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {(Object.entries(FIELD_TYPE_LABELS) as [EmrFieldType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Separator preview — only for separator type */}
        {field.type === "separator" && (
          <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 border border-dashed border-border">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {field.label || "Тусгаарлах текст"}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {/* Unit + Placeholder — not shown for separator */}
        {field.type !== "separator" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1 block">Нэгж <span className="text-muted-foreground">(unit)</span></Label>
              <Input
                value={field.unit ?? ""}
                onChange={(e) => onChange({ ...field, unit: e.target.value })}
                className="h-8 text-sm"
                placeholder="мг, °C, ..."
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Placeholder</Label>
              <Input
                value={field.placeholder ?? ""}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        )}

        {/* Required checkbox — not shown for separator */}
        {field.type !== "separator" && (
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={field.required ?? false}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="rounded accent-primary"
            />
            <span className="font-medium">Заавал бөглөх</span>
          </label>
        )}

        {/* Options (select / radio / checkbox) */}
        {hasOptions && (
          <div className="space-y-2 border-t border-border pt-3">
            <Label className="text-xs font-medium">Сонголтууд</Label>
            {(field.options ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">Сонголт нэмэгдээгүй байна.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {(field.options ?? []).map((opt, i) => (
                  <span key={i}
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full border border-border">
                    {opt}
                    <button onClick={() => removeOpt(i)}
                      className="hover:text-destructive">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={optInput}
                onChange={(e) => setOptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOpt())}
                placeholder="Сонголт нэмэх... (Enter)"
                className="h-8 text-sm flex-1"
              />
              <Button
                size="sm" variant="outline" onClick={addOpt} className="h-8 px-3"
                title="Бүхэлд нь нэг сонголт болгож нэмэх"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm" variant="outline" onClick={addOptSplit} className="h-8 px-3 gap-1"
                title="Зайгаар тусгаарлаж тус тусдаа сонголт болгох"
              >
                <Scissors className="h-3.5 w-3.5" />
                Салгах
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              <strong>+</strong> бүхэлд нь нэг сонголт · <strong>Салгах</strong> зайгаар тусгаарлаж тус тусад нь
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SectionPanel — right-side field editor for a section ──────── */
function SectionPanel({
  section,
  onChange,
}: {
  section: EmrSectionConfig;
  onChange: (s: EmrSectionConfig) => void;
}) {
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

  const moveField = (idx: number, dir: -1 | 1) => {
    const arr = [...section.fields];
    const t = idx + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[idx], arr[t]] = [arr[t], arr[idx]];
    onChange({ ...section, fields: arr });
  };

  if (section.type === "vitals") {
    return (
      <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground bg-muted/5">
        <HeartPulseIcon className="h-8 w-8 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Амин үзүүлэлтийн хэсэг</p>
        <p className="text-xs mt-1 opacity-70">
          Энэ section нь системийн амин үзүүлэлтийн модулийг автоматаар харуулна.<br />
          Талбар тохируулах шаардлагагүй.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {section.fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center">
          <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Талбар нэмэгдээгүй байна.</p>
          <p className="text-xs text-muted-foreground mt-1">Доорх товчийг дарж талбар нэмнэ үү.</p>
        </div>
      ) : (
        section.fields.map((f, i) => (
          <FieldEditor
            key={f.id}
            field={f}
            onChange={(nf) => updateField(i, nf)}
            onDelete={() => deleteField(i)}
            onMoveUp={() => moveField(i, -1)}
            onMoveDown={() => moveField(i, 1)}
            isFirst={i === 0}
            isLast={i === section.fields.length - 1}
          />
        ))
      )}
      <Button variant="outline" size="sm" onClick={addField}
        className="w-full border-dashed h-9 text-muted-foreground hover:text-foreground">
        <Plus className="h-3.5 w-3.5" />
        Талбар нэмэх
      </Button>
    </div>
  );
}

function HeartPulseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 12h3l2-6 4 12 2-6h3M19 7a3 3 0 00-3-3 3 3 0 00-3 3c0 3 3 5 3 5s3-2 3-5z" />
    </svg>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function EmrTemplatePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const { data: tmpl, isLoading } = useQuery({
    queryKey: ["emr-template"],
    queryFn: getEmrTemplate,
  });

  /* Local working copy — initialised once from server */
  const [tabs, setTabs] = useState<EmrTabConfig[]>([]);
  const [loaded, setLoaded] = useState(false);

  /* Active selection */
  const [activeTabIdx, setActiveTabIdx]         = useState(0);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);

  /* Inline rename state */
  const [editingTabId,     setEditingTabId]     = useState<string | null>(null);
  const [editingTabName,   setEditingTabName]   = useState("");
  const [editingSecId,     setEditingSecId]     = useState<string | null>(null);
  const [editingSecName,   setEditingSecName]   = useState("");

  /* Populate once */
  useEffect(() => {
    if (tmpl && !loaded) {
      setTabs(tmpl.tabs ?? []);
      setLoaded(true);
      setActiveTabIdx(0);
      setActiveSectionIdx(null);
    }
  }, [tmpl, loaded]);

  /* Mutation */
  const mutation = useMutation({
    mutationFn: () => updateEmrTemplate(tabs),
    onSuccess: () => {
      toast({ title: "Загвар хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["emr-template"] });
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  /* ── Tab helpers ────────────────────────────────────────────────── */
  const addTab = () => {
    const newTab: EmrTabConfig = {
      id: uid(), name: "Шинэ таб", order: tabs.length, sections: [],
    };
    const next = [...tabs, newTab];
    setTabs(next);
    setActiveTabIdx(next.length - 1);
    setActiveSectionIdx(null);
    // immediately start renaming
    setEditingTabId(newTab.id);
    setEditingTabName(newTab.name);
  };

  const deleteTab = (idx: number) => {
    const next = tabs.filter((_, i) => i !== idx).map((t, i) => ({ ...t, order: i }));
    setTabs(next);
    setActiveTabIdx(Math.max(0, idx - 1));
    setActiveSectionIdx(null);
  };

  const renameTab = (idx: number, name: string) => {
    setTabs(tabs.map((t, i) => (i === idx ? { ...t, name } : t)));
    setEditingTabId(null);
  };

  /* ── Section helpers ────────────────────────────────────────────── */
  const addSection = (tabIdx: number) => {
    const tab = tabs[tabIdx];
    if (!tab) return;
    const newSec: EmrSectionConfig = {
      id: uid(), name: "Шинэ бүлэг",
      order: tab.sections.length, type: "custom", fields: [],
    };
    const updatedTab = { ...tab, sections: [...tab.sections, newSec] };
    const next = tabs.map((t, i) => (i === tabIdx ? updatedTab : t));
    setTabs(next);
    setActiveSectionIdx(updatedTab.sections.length - 1);
    setEditingSecId(newSec.id);
    setEditingSecName(newSec.name);
  };

  const deleteSection = (tabIdx: number, secIdx: number) => {
    const tab = tabs[tabIdx];
    if (!tab) return;
    const sections = tab.sections.filter((_, i) => i !== secIdx)
      .map((s, i) => ({ ...s, order: i }));
    setTabs(tabs.map((t, i) => (i === tabIdx ? { ...t, sections } : t)));
    setActiveSectionIdx(sections.length > 0 ? Math.max(0, secIdx - 1) : null);
  };

  const renameSection = (tabIdx: number, secIdx: number, name: string) => {
    const tab = tabs[tabIdx];
    if (!tab) return;
    const sections = tab.sections.map((s, i) => (i === secIdx ? { ...s, name } : s));
    setTabs(tabs.map((t, i) => (i === tabIdx ? { ...t, sections } : t)));
    setEditingSecId(null);
  };

  const moveSection = (tabIdx: number, secIdx: number, dir: -1 | 1) => {
    const tab = tabs[tabIdx];
    if (!tab) return;
    const arr = [...tab.sections];
    const t = secIdx + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[secIdx], arr[t]] = [arr[t], arr[secIdx]];
    setTabs(tabs.map((x, i) => (i === tabIdx ? { ...x, sections: arr.map((s, j) => ({ ...s, order: j })) } : x)));
    setActiveSectionIdx(t);
  };

  const setSectionType = (tabIdx: number, secIdx: number, type: "vitals" | "custom") => {
    const tab = tabs[tabIdx];
    if (!tab) return;
    const sections = tab.sections.map((s, i) =>
      i === secIdx ? { ...s, type, fields: type === "vitals" ? [] : s.fields } : s
    );
    setTabs(tabs.map((t, i) => (i === tabIdx ? { ...t, sections } : t)));
  };

  const updateSection = (tabIdx: number, secIdx: number, sec: EmrSectionConfig) => {
    const tab = tabs[tabIdx];
    if (!tab) return;
    const sections = tab.sections.map((s, i) => (i === secIdx ? sec : s));
    setTabs(tabs.map((t, i) => (i === tabIdx ? { ...t, sections } : t)));
  };

  /* ── Derived ──────────────────────────────────────────────────────*/
  const currentTab = tabs[activeTabIdx] ?? null;
  const currentSection =
    currentTab && activeSectionIdx !== null
      ? currentTab.sections[activeSectionIdx] ?? null
      : null;

  /* ── Guards ─────────────────────────────────────────────────────── */
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="text-sm">Зөвхөн администратор тохируулах боломжтой.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            EMR загвар тохируулах
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Үзлэгийн картанд харагдах таб, бүлэг, талбаруудыг тохируулна.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !loaded}>
          {mutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Save className="h-4 w-4" />}
          Хадгалах
        </Button>
      </div>

      {/* ── Fixed Tab 1 note ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground bg-muted/10 flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>Tab 1 — Үзлэгийн мэдээлэл</strong>
          <span className="ml-1.5 opacity-70">(Зовиур · Шинж тэмдэг · Онош · Эмчилгээ · Эмийн жор) — тогтмол, засагдахгүй</span>
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-[280px_1fr] gap-4 min-h-[600px]">
          {/* ── LEFT: Tab + Section tree ─────────────────────────────── */}
          <div className="space-y-3">
            {/* Tab list */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3 py-2 bg-muted/30 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Табууд</span>
                <button onClick={addTab}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Таб нэмэх">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {tabs.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Таб нэмэгдээгүй байна
                </div>
              ) : (
                <ul>
                  {tabs.map((tab, ti) => (
                    <li key={tab.id}>
                      {/* Tab row */}
                      <div
                        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors ${
                          ti === activeTabIdx
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-muted/30"
                        }`}
                        onClick={() => { setActiveTabIdx(ti); setActiveSectionIdx(null); }}
                      >
                        {/* Inline rename */}
                        {editingTabId === tab.id ? (
                          <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingTabName}
                              onChange={(e) => setEditingTabName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") renameTab(ti, editingTabName.trim() || tab.name);
                                if (e.key === "Escape") setEditingTabId(null);
                              }}
                              className="h-7 text-xs flex-1"
                              autoFocus
                            />
                            <button onClick={() => renameTab(ti, editingTabName.trim() || tab.name)}
                              className="text-emerald-600 shrink-0"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setEditingTabId(null)}
                              className="text-muted-foreground shrink-0"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <button
                            className="flex-1 text-sm font-medium text-left truncate"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingTabId(tab.id);
                              setEditingTabName(tab.name);
                            }}
                            title="Давхар дарж нэрийг засна"
                          >
                            {tab.name}
                          </button>
                        )}

                        {/* Edit name pencil */}
                        {editingTabId !== tab.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTabId(tab.id); setEditingTabName(tab.name); }}
                            className="text-muted-foreground/40 hover:text-muted-foreground shrink-0"
                            title="Нэр засах">
                            ✏️
                          </button>
                        )}

                        {/* Delete tab */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTab(ti); }}
                          className="text-muted-foreground/40 hover:text-destructive shrink-0"
                          title="Таб устгах">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Sections under active tab */}
                      {ti === activeTabIdx && (
                        <ul className="bg-muted/5">
                          {currentTab?.sections.map((sec, si) => (
                            <li key={sec.id}>
                              <div
                                className={`flex items-center gap-1.5 pl-6 pr-3 py-2 cursor-pointer border-b border-border/30 transition-colors text-sm ${
                                  si === activeSectionIdx
                                    ? "bg-accent/60 text-accent-foreground font-medium"
                                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                }`}
                                onClick={() => setActiveSectionIdx(si)}
                              >
                                {/* Reorder */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button disabled={si === 0}
                                    onClick={(e) => { e.stopPropagation(); moveSection(ti, si, -1); }}
                                    className="disabled:opacity-20 hover:text-foreground">
                                    <ChevronUp className="h-2.5 w-2.5" />
                                  </button>
                                  <button disabled={si === (currentTab?.sections.length ?? 0) - 1}
                                    onClick={(e) => { e.stopPropagation(); moveSection(ti, si, 1); }}
                                    className="disabled:opacity-20 hover:text-foreground">
                                    <ChevronDown className="h-2.5 w-2.5" />
                                  </button>
                                </div>

                                {/* Section name — inline rename */}
                                {editingSecId === sec.id ? (
                                  <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Input
                                      value={editingSecName}
                                      onChange={(e) => setEditingSecName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") renameSection(ti, si, editingSecName.trim() || sec.name);
                                        if (e.key === "Escape") setEditingSecId(null);
                                      }}
                                      className="h-6 text-xs flex-1"
                                      autoFocus
                                    />
                                    <button onClick={() => renameSection(ti, si, editingSecName.trim() || sec.name)}
                                      className="text-emerald-600"><Check className="h-3 w-3" /></button>
                                    <button onClick={() => setEditingSecId(null)}
                                      className="text-muted-foreground"><X className="h-3 w-3" /></button>
                                  </div>
                                ) : (
                                  <span className="flex-1 truncate text-xs">{sec.name}</span>
                                )}

                                {/* Section type badge */}
                                <Badge
                                  tone={sec.type === "vitals" ? "primary" : "muted"}
                                  className="text-[9px] shrink-0">
                                  {sec.type === "vitals" ? "V" : sec.fields.length}
                                </Badge>

                                {/* Edit + Delete */}
                                {editingSecId !== sec.id && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingSecId(sec.id); setEditingSecName(sec.name); }}
                                    className="text-muted-foreground/40 hover:text-muted-foreground shrink-0"
                                    title="Нэр засах">
                                    ✏️
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteSection(ti, si); }}
                                  className="text-muted-foreground/40 hover:text-destructive shrink-0">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </li>
                          ))}

                          {/* Add section */}
                          <li>
                            <button
                              onClick={() => addSection(ti)}
                              className="flex items-center gap-2 pl-6 pr-3 py-2 w-full text-xs text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors border-b border-border/30"
                            >
                              <Plus className="h-3 w-3" />
                              Бүлэг нэмэх
                            </button>
                          </li>
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Add tab button at bottom */}
              <button
                onClick={addTab}
                className="flex items-center gap-2 px-3 py-2.5 w-full text-xs text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors border-t border-border"
              >
                <Plus className="h-3.5 w-3.5" />
                Шинэ таб нэмэх
              </button>
            </div>
          </div>

          {/* ── RIGHT: Section detail ─────────────────────────────────── */}
          <div>
            {!currentTab ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-16 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Зүүн талаас таб сонгоно уу.</p>
                  <p className="text-xs mt-1">Эсвэл шинэ таб нэмнэ үү.</p>
                </CardContent>
              </Card>
            ) : currentSection === null ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-16 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">«{currentTab.name}» таб</p>
                    <p className="text-xs">Зүүн талаас бүлэг сонгоно уу.</p>
                    <p className="text-xs">Эсвэл «Бүлэг нэмэх» дарна уу.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="py-3 px-5 border-b border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{currentSection.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {currentTab.name} → {currentSection.name}
                      </p>
                    </div>
                    {/* Section type toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Label className="text-xs text-muted-foreground">Төрөл:</Label>
                      <select
                        value={currentSection.type}
                        onChange={(e) =>
                          setSectionType(activeTabIdx, activeSectionIdx!, e.target.value as any)
                        }
                        className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="custom">Custom (талбартай)</option>
                        <option value="vitals">Амин үзүүлэлт</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <SectionPanel
                    section={currentSection}
                    onChange={(s) => updateSection(activeTabIdx, activeSectionIdx!, s)}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
