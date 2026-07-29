"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, ReceiptText, PlugZap, CheckCircle2, XCircle } from "lucide-react";
import { ROLES, type EbarimtInfo } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth-guard";
import { getEbarimtConfig, updateEbarimtConfig, getEbarimtInfo } from "@/lib/ebarimt-api";
import { extractApiError } from "@/lib/api";

function EbarimtSettingsInner() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: saved, isLoading } = useQuery({
    queryKey: ["ebarimt-config"],
    queryFn: getEbarimtConfig,
  });

  const [enabled, setEnabled]           = useState(false);
  const [posApiUrl, setPosApiUrl]       = useState("http://localhost:7080");
  const [merchantTin, setMerchantTin]   = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [posNo, setPosNo]               = useState("");
  const [classificationCode, setClassificationCode] = useState("");

  useEffect(() => {
    if (!saved) return;
    setEnabled(saved.enabled);
    setPosApiUrl(saved.posApiUrl || "http://localhost:7080");
    setMerchantTin(saved.merchantTin ?? "");
    setDistrictCode(saved.districtCode ?? "");
    setPosNo(saved.posNo ?? "");
    setClassificationCode(saved.classificationCode ?? "");
  }, [saved]);

  const save = useMutation({
    mutationFn: () =>
      updateEbarimtConfig({
        enabled,
        posApiUrl: posApiUrl.trim(),
        merchantTin: merchantTin.trim(),
        districtCode: districtCode.trim(),
        posNo: posNo.trim(),
        classificationCode: classificationCode.trim(),
      }),
    onSuccess: () => {
      toast({ title: "И-Баримт тохиргоо хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["ebarimt-config"] });
    },
    onError: (e) => toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const [info, setInfo] = useState<EbarimtInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const testConn = useMutation({
    mutationFn: getEbarimtInfo,
    onSuccess: (d) => { setInfo(d); setInfoError(null); },
    onError: (e) => { setInfo(null); setInfoError(extractApiError(e)); },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            И-Баримт (PosAPI)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Татварын И-Баримт (ebarimt) — PosAPI 3.0 холболтын тохиргоо
          </p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Хадгалах
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Холболтын тохиргоо</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/30">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-primary rounded"
            />
            <span className="text-sm font-medium">И-Баримт идэвхжүүлэх</span>
            <span className="ml-auto text-xs text-muted-foreground">
              Merchant бүртгэл аваагүй бол унтраалттай байлгана
            </span>
          </label>

          <div className="space-y-1.5">
            <Label>PosAPI хаяг *</Label>
            <Input value={posApiUrl} onChange={(e) => setPosApiUrl(e.target.value)} placeholder="http://localhost:7080" className="font-mono" />
            <p className="text-[11px] text-muted-foreground">PosAPI сервис суулгасан компьютерийн хаяг (default порт 7080)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Байгууллагын ТТД (merchantTin) *</Label>
              <Input value={merchantTin} onChange={(e) => setMerchantTin(e.target.value)} placeholder="11 эсвэл 14 орон" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Дүүргийн код *</Label>
              <Input value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} placeholder="жш: 3420" className="font-mono" maxLength={4} />
            </div>
            <div className="space-y-1.5">
              <Label>Кассын дугаар (posNo) *</Label>
              <Input value={posNo} onChange={(e) => setPosNo(e.target.value)} placeholder="жш: 10000001" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Ангиллын код (ҮАБ)</Label>
              <Input value={classificationCode} onChange={(e) => setClassificationCode(e.target.value)} placeholder="жш: 8610000" className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">PosAPI холболт шалгах</CardTitle>
          <Button variant="outline" size="sm" onClick={() => testConn.mutate()} disabled={testConn.isPending}>
            {testConn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
            Шалгах
          </Button>
        </CardHeader>
        <CardContent>
          {infoError && (
            <div className="flex items-start gap-2 text-sm text-rose-600">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{infoError}</span>
            </div>
          )}
          {info && (
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Холболт амжилттай
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-1 text-xs">
                <span className="text-muted-foreground">Оператор:</span><span>{info.operatorName ?? "—"}</span>
                <span className="text-muted-foreground">Оператор ТТД:</span><span className="font-mono">{info.operatorTIN ?? "—"}</span>
                <span className="text-muted-foreground">Кассын дугаар:</span><span className="font-mono">{info.posNo ?? "—"}</span>
                <span className="text-muted-foreground">Сүүлд илгээсэн:</span><span>{info.lastSentDate ?? "—"}</span>
                <span className="text-muted-foreground">Үлдсэн сугалаа:</span><span>{info.leftLotteries ?? "—"}</span>
              </div>
              {info.merchants && info.merchants.length > 0 && (
                <div className="text-xs mt-2">
                  <span className="text-muted-foreground">Merchant-ууд:</span>
                  <ul className="mt-1 space-y-0.5">
                    {info.merchants.map((m) => (
                      <li key={m.tin} className="font-mono">{m.tin} — {m.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {!info && !infoError && (
            <p className="text-xs text-muted-foreground">
              PosAPI суулгасны дараа &quot;Шалгах&quot; товчоор холболтоо баталгаажуулна.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ажиллах зарчим</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5">
          <p>1. Нэхэмжлэл <strong>бүрэн төлөгдсөн</strong> (Төлсөн статус) үед нэхэмжлэлийн дэлгэцэд &quot;И-Баримт гаргах&quot; товч гарна.</p>
          <p>2. Товч дармагц PosAPI руу баримт илгээгдэж, сугалааны дугаар + QR кодтой баримт XPrinter дээр хэвлэгдэнэ.</p>
          <p>3. Гаргасан И-Баримтыг дахин хэвлэх боломжтой (давхар гаргахгүй).</p>
          <p>4. Merchant бүртгэл аваагүй үед &quot;Идэвхжүүлэх&quot;-ийг унтраалттай байлгавал систем хэвийн ажиллана.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EbarimtSettingsPage() {
  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN]}>
      <EbarimtSettingsInner />
    </AuthGuard>
  );
}
