"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Printer, Upload, X, Eye, Save, Loader2, RotateCcw } from "lucide-react";
import type { PrintConfig } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getPrintConfig, updatePrintConfig } from "@/lib/print-config-api";
import { openPrintWindow } from "@/lib/print-utils";
import { printThermalInvoice, THERMAL_WIDTH_LABELS, type ThermalWidthKey } from "@/lib/thermal-print";
import { extractApiError } from "@/lib/api";
import type { Invoice } from "@his/shared";

const PAGE_SIZES = ["A4", "A5"] as const;
const RECEIPT_WIDTHS: ThermalWidthKey[] = ["58", "76", "80"];
const ORIENTATIONS = [
  { value: "portrait",  label: "Босоо (Portrait)" },
  { value: "landscape", label: "Хэвтээ (Landscape)" },
] as const;

function ColorSwatch({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-9 w-9 rounded-md border border-border shadow-sm"
          style={{ background: value }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1e293b"
          className="h-9 font-mono text-sm flex-1"
          maxLength={20}
        />
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </div>
    </div>
  );
}

export default function PrintSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: saved, isLoading } = useQuery({
    queryKey: ["print-config"],
    queryFn: getPrintConfig,
  });

  /* Local form state */
  const [orgName,          setOrgName]          = useState("MEDLIVER");
  const [orgSubtitle,      setOrgSubtitle]      = useState("");
  const [orgAddress,       setOrgAddress]       = useState("");
  const [orgPhone,         setOrgPhone]         = useState("");
  const [orgEmail,         setOrgEmail]         = useState("");
  const [logoUrl,          setLogoUrl]          = useState("");
  const [showLogo,         setShowLogo]         = useState(false);
  const [stampUrl,         setStampUrl]         = useState("");
  const [showStamp,        setShowStamp]        = useState(false);
  const [headerBgColor,    setHeaderBgColor]    = useState("#1e293b");
  const [headerTextColor,  setHeaderTextColor]  = useState("#ffffff");
  const [fontSize,         setFontSize]         = useState(13);
  const [pageSize,         setPageSize]         = useState<"A4" | "A5">("A4");
  const [pageOrientation,  setPageOrientation]  = useState<"portrait" | "landscape">("portrait");
  const [footerNote,       setFooterNote]       = useState("");
  const [receiptWidth,     setReceiptWidth]     = useState<ThermalWidthKey>("80");

  /* Patient fields */
  const [showPatientCode,      setShowPatientCode]      = useState(true);
  const [showPatientRegister,  setShowPatientRegister]  = useState(true);
  const [showPatientAge,       setShowPatientAge]       = useState(true);
  const [showPatientGender,    setShowPatientGender]    = useState(true);
  const [showPatientPhone,     setShowPatientPhone]     = useState(true);
  const [showPatientAddress,   setShowPatientAddress]   = useState(false);
  const [showPatientBloodType, setShowPatientBloodType] = useState(false);
  const [showPatientBirthDate, setShowPatientBirthDate] = useState(false);
  const [showPatientDoctor,    setShowPatientDoctor]    = useState(false);

  /* Fill form when data loads */
  useEffect(() => {
    if (!saved) return;
    setOrgName(saved.orgName ?? "MEDLIVER");
    setOrgSubtitle(saved.orgSubtitle ?? "");
    setOrgAddress(saved.orgAddress ?? "");
    setOrgPhone(saved.orgPhone ?? "");
    setOrgEmail(saved.orgEmail ?? "");
    setLogoUrl(saved.logoUrl ?? "");
    setShowLogo(saved.showLogo ?? false);
    setStampUrl(saved.stampUrl ?? "");
    setShowStamp(saved.showStamp ?? false);
    setHeaderBgColor(saved.headerBgColor ?? "#1e293b");
    setHeaderTextColor(saved.headerTextColor ?? "#ffffff");
    setFontSize(saved.fontSize ?? 13);
    setPageSize((saved.pageSize as "A4" | "A5") ?? "A4");
    setPageOrientation((saved.pageOrientation as "portrait" | "landscape") ?? "portrait");
    setFooterNote(saved.footerNote ?? "");
    setReceiptWidth((saved.receiptWidth as ThermalWidthKey) ?? "80");
    setShowPatientCode(saved.showPatientCode ?? true);
    setShowPatientRegister(saved.showPatientRegister ?? true);
    setShowPatientAge(saved.showPatientAge ?? true);
    setShowPatientGender(saved.showPatientGender ?? true);
    setShowPatientPhone(saved.showPatientPhone ?? true);
    setShowPatientAddress(saved.showPatientAddress ?? false);
    setShowPatientBloodType(saved.showPatientBloodType ?? false);
    setShowPatientBirthDate(saved.showPatientBirthDate ?? false);
    setShowPatientDoctor(saved.showPatientDoctor ?? false);
  }, [saved]);

  /* Logo file upload → base64 */
  const fileRef = useRef<HTMLInputElement>(null);
  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast({ title: "Logo 512KB-аас бага байх ёстой", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setLogoUrl(reader.result as string); setShowLogo(true); };
    reader.readAsDataURL(file);
  };

  /* Stamp file upload → base64 */
  const stampRef = useRef<HTMLInputElement>(null);
  const handleStampFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast({ title: "Тамга 512KB-аас бага байх ёстой", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setStampUrl(reader.result as string); setShowStamp(true); };
    reader.readAsDataURL(file);
  };

  const saveMut = useMutation({
    mutationFn: () =>
      updatePrintConfig({
        orgName, orgSubtitle: orgSubtitle || undefined,
        orgAddress: orgAddress || undefined,
        orgPhone: orgPhone || undefined,
        orgEmail: orgEmail || undefined,
        logoUrl: logoUrl || undefined,
        showLogo,
        stampUrl: stampUrl || undefined,
        showStamp,
        headerBgColor, headerTextColor,
        fontSize, pageSize, pageOrientation,
        footerNote: footerNote || undefined,
        receiptWidth,
        showPatientCode, showPatientRegister, showPatientAge,
        showPatientGender, showPatientPhone, showPatientAddress,
        showPatientBloodType, showPatientBirthDate, showPatientDoctor,
      }),
    onSuccess: () => {
      toast({ title: "Хэвлэх загвар хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["print-config"] });
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const previewConfig: Partial<PrintConfig> = {
    orgName, orgSubtitle: orgSubtitle || undefined,
    orgAddress: orgAddress || undefined,
    orgPhone: orgPhone || undefined,
    logoUrl: logoUrl || undefined, showLogo,
    stampUrl: stampUrl || undefined, showStamp,
    headerBgColor, headerTextColor,
    fontSize, pageSize, pageOrientation,
    footerNote: footerNote || undefined,
  };

  const handlePreview = () => {
    openPrintWindow(
      "Хэвлэх загвар — Preview",
      "НЭХЭМЖЛЭЛ / INVOICE",
      `
      <div class="p-meta">
        <div class="p-meta-block"><span>Өвчтөн</span><strong>Батбаяр Дорж</strong></div>
        <div class="p-meta-block"><span>Нэхэмжлэлийн дугаар</span><strong style="font-family:monospace">INV-2025-00123</strong></div>
        <div class="p-meta-block"><span>Огноо</span><strong>${new Date().toLocaleDateString("mn-MN")}</strong></div>
      </div>
      <table>
        <thead><tr><th>Үйлчилгээ</th><th>Тоо</th><th>Нэгж үнэ</th><th>Дүн</th></tr></thead>
        <tbody>
          <tr style="background:#fff;border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px">Үзлэг</td><td style="padding:8px 12px;text-align:center">1</td><td style="padding:8px 12px;text-align:right">50,000₮</td><td style="padding:8px 12px;text-align:right;font-weight:600">50,000₮</td></tr>
          <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px">Шинжилгээ</td><td style="padding:8px 12px;text-align:center">2</td><td style="padding:8px 12px;text-align:right">30,000₮</td><td style="padding:8px 12px;text-align:right;font-weight:600">60,000₮</td></tr>
        </tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:8px 12px;text-align:right;font-weight:700">Нийт дүн</td><td style="padding:8px 12px;text-align:right;font-weight:700;font-size:15px">110,000₮</td></tr>
        </tfoot>
      </table>`,
      previewConfig,
    );
  };

  const handleReceiptPreview = () => {
    const sample: Invoice = {
      id: "preview",
      invoiceNumber: "INV-2025-00123",
      patientId: "preview",
      patientName: "Батбаяр Дорж",
      patientCode: "P-000123",
      items: [
        { name: "Үзлэг", quantity: 1, unitPrice: 50000, total: 50000 },
        { name: "Ерөнхий цусны шинжилгээ (CBC)", quantity: 2, unitPrice: 30000, total: 60000 },
      ],
      subtotal: 110000,
      discount: 0,
      vat: 11000,
      vatRate: 10,
      total: 121000,
      paid: 121000,
      balance: 0,
      status: "paid",
      payments: [{ amount: 121000, method: "cash", paidAt: new Date().toISOString() }],
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    printThermalInvoice(sample, previewConfig, undefined, receiptWidth);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Хэвлэх загвар
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Нэхэмжлэл, шинжилгээ, үзлэг, эмчилгээний хэвлэх загварыг тохируулна
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Хадгалах
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Байгууллагын мэдээлэл ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Байгууллагын мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Байгууллагын нэр <span className="text-destructive">*</span></Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="MEDLIVER" />
            </div>
            <div className="space-y-1.5">
              <Label>Дэд гарчиг</Label>
              <Input value={orgSubtitle} onChange={(e) => setOrgSubtitle(e.target.value)} placeholder="Хувийн эмнэлэг" />
            </div>
            <div className="space-y-1.5">
              <Label>Хаяг</Label>
              <Input value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} placeholder="Улаанбаатар хот..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Утас</Label>
                <Input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} placeholder="99112233" />
              </div>
              <div className="space-y-1.5">
                <Label>Имэйл</Label>
                <Input value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} placeholder="info@..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Footer тэмдэглэл</Label>
              <Input value={footerNote} onChange={(e) => setFooterNote(e.target.value)} placeholder="Баярлалаа ..." />
            </div>
          </CardContent>
        </Card>

        {/* ── Загварын тохиргоо ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Загварын тохиргоо</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="relative h-14 w-24 rounded-md border border-border overflow-hidden bg-muted/20 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="logo" className="h-12 w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => { setLogoUrl(""); setShowLogo(false); }}
                      className="absolute top-0.5 right-0.5 h-5 w-5 bg-white/80 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-14 w-24 rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                    Logo
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="w-full">
                    <Upload className="h-3.5 w-3.5" />
                    Файл оруулах
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoFile} />
                  <Input
                    value={logoUrl.startsWith("data:") ? "" : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Эсвэл URL оруулах..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogo((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showLogo ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showLogo ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <Label className="text-xs cursor-pointer" onClick={() => setShowLogo((v) => !v)}>Logo харуулах</Label>
              </div>
            </div>

            {/* Stamp */}
            <div className="space-y-2">
              <Label>Тамга / Баталгааны тэмдэг</Label>
              <div className="flex items-center gap-3">
                {stampUrl ? (
                  <div className="relative h-16 w-16 rounded-full border border-border overflow-hidden bg-muted/20 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={stampUrl} alt="stamp" className="h-14 w-14 object-contain opacity-80" />
                    <button
                      type="button"
                      onClick={() => { setStampUrl(""); setShowStamp(false); }}
                      className="absolute top-0 right-0 h-5 w-5 bg-white/80 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs text-center">
                    Тамга
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  <Button variant="outline" size="sm" onClick={() => stampRef.current?.click()} className="w-full">
                    <Upload className="h-3.5 w-3.5" />
                    Файл оруулах
                  </Button>
                  <input ref={stampRef} type="file" accept="image/*" className="sr-only" onChange={handleStampFile} />
                  <Input
                    value={stampUrl.startsWith("data:") ? "" : stampUrl}
                    onChange={(e) => setStampUrl(e.target.value)}
                    placeholder="Эсвэл URL..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStamp((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showStamp ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showStamp ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <Label className="text-xs cursor-pointer" onClick={() => setShowStamp((v) => !v)}>
                  Тамга харуулах (баруун доод булан)
                </Label>
              </div>
            </div>

            {/* Header colors */}
            <div className="grid grid-cols-2 gap-3">
              <ColorSwatch label="Header дэвсгэр өнгө" value={headerBgColor} onChange={setHeaderBgColor} />
              <ColorSwatch label="Header текст өнгө" value={headerTextColor} onChange={setHeaderTextColor} />
            </div>

            {/* Font size */}
            <div className="space-y-2">
              <Label className="text-xs">Фонт хэмжээ — {fontSize}px</Label>
              <input
                type="range" min={10} max={16} step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10px жижиг</span><span>16px том</span>
              </div>
            </div>

            {/* Page size + orientation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Хуудасны хэмжээ</Label>
                <div className="flex gap-1">
                  {PAGE_SIZES.map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => setPageSize(s)}
                      className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${pageSize === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Чиглэл</Label>
                <div className="flex gap-1">
                  {ORIENTATIONS.map((o) => (
                    <button
                      key={o.value} type="button"
                      onClick={() => setPageOrientation(o.value)}
                      className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors ${pageOrientation === o.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      {o.value === "portrait" ? "Босоо" : "Хэвтээ"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thermal receipt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">XPrinter хэвлэх (Thermal receipt)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Xprinter төрлийн (XP-58, XP-Q200, XP-V320, XP-N160I гэх мэт) тасалбар хэвлэгчид зориулсан
            өргөн. Нэхэмжлэлийн дэлгэц дээрх &quot;XPrinter&quot; товч энэ өргөнөөр анхдагчаар нээгдэнэ.
          </p>
          <div className="flex gap-1 max-w-xs">
            {RECEIPT_WIDTHS.map((w) => (
              <button
                key={w} type="button"
                onClick={() => setReceiptWidth(w)}
                className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${receiptWidth === w ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
              >
                {THERMAL_WIDTH_LABELS[w]}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleReceiptPreview}>
            <Eye className="h-3.5 w-3.5" />
            XPrinter Preview
          </Button>
        </CardContent>
      </Card>

      {/* Patient fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Өвчтөний мэдээлэл — харагдах талбарууд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {([
              { key: "showPatientCode",      label: "Өвчтөний код",      state: showPatientCode,      set: setShowPatientCode },
              { key: "showPatientRegister",  label: "Регистрийн дугаар", state: showPatientRegister,  set: setShowPatientRegister },
              { key: "showPatientAge",       label: "Нас",               state: showPatientAge,       set: setShowPatientAge },
              { key: "showPatientBirthDate", label: "Төрсөн огноо",      state: showPatientBirthDate, set: setShowPatientBirthDate },
              { key: "showPatientGender",    label: "Хүйс",              state: showPatientGender,    set: setShowPatientGender },
              { key: "showPatientPhone",     label: "Утас",              state: showPatientPhone,     set: setShowPatientPhone },
              { key: "showPatientAddress",   label: "Хаяг",              state: showPatientAddress,   set: setShowPatientAddress },
              { key: "showPatientBloodType", label: "Цусны бүлэг",       state: showPatientBloodType, set: setShowPatientBloodType },
              { key: "showPatientDoctor",    label: "Хяналтын эмч",      state: showPatientDoctor,    set: setShowPatientDoctor },
            ] as const).map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={f.state}
                  onChange={(e) => (f.set as (v: boolean) => void)(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded"
                />
                <span className="text-sm">{f.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Сонгосон талбарууд бүх хэвлэх маягтын өвчтөний мэдээллийн хэсэгт харагдана.
          </p>
        </CardContent>
      </Card>

      {/* Live mini preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Урьдчилан харах
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg overflow-hidden border border-border text-white text-center py-5 px-4"
            style={{ background: headerBgColor, color: headerTextColor }}
          >
            {showLogo && logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" className="h-12 object-contain mx-auto mb-2" />
            )}
            <div style={{ fontSize: `${fontSize + 8}px`, fontWeight: "bold", letterSpacing: "2px" }}>
              {orgName || "MEDLIVER"}
            </div>
            {orgSubtitle && (
              <div style={{ fontSize: `${fontSize}px`, opacity: 0.8, marginTop: "4px" }}>{orgSubtitle}</div>
            )}
            {orgAddress && (
              <div style={{ fontSize: `${fontSize - 1}px`, opacity: 0.7, marginTop: "2px" }}>{orgAddress}</div>
            )}
            {(orgPhone || orgEmail) && (
              <div style={{ fontSize: `${fontSize - 2}px`, opacity: 0.7, marginTop: "2px" }}>
                {[orgPhone && `Утас: ${orgPhone}`, orgEmail].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-dashed border-border pt-2">
            <span>Хэвлэсэн: {new Date().toLocaleDateString("mn-MN")}</span>
            {footerNote && <span>{footerNote}</span>}
            {showStamp && stampUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stampUrl} alt="тамга" className="h-12 w-12 object-contain opacity-75" />
            ) : (
              <span
                className="px-3 py-0.5 rounded border font-semibold"
                style={{ borderColor: headerBgColor, color: headerBgColor }}
              >
                {orgName || "MEDLIVER"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
