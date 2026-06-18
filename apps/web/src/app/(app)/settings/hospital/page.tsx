"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Upload, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getHospitalConfig, updateHospitalConfig } from "@/lib/hospital-config-api";
import { extractApiError } from "@/lib/api";

export default function HospitalSettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: saved, isLoading } = useQuery({
    queryKey: ["hospital-config"],
    queryFn: getHospitalConfig,
  });

  const [name,          setName]          = useState("MEDLIVER");
  const [logoBase64,    setLogoBase64]    = useState("");
  const [faviconBase64, setFaviconBase64] = useState("");

  useEffect(() => {
    if (!saved) return;
    setName(saved.name ?? "MEDLIVER");
    setLogoBase64(saved.logoBase64 ?? "");
    setFaviconBase64(saved.faviconBase64 ?? "");
  }, [saved]);

  const logoRef    = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  function readFile(
    e: React.ChangeEvent<HTMLInputElement>,
    maxBytes: number,
    onLoad: (dataUrl: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) {
      toast({
        title: `Файл хэт том байна (max ${Math.round(maxBytes / 1024)} KB)`,
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result as string);
    reader.readAsDataURL(file);
  }

  const saveMut = useMutation({
    mutationFn: () =>
      updateHospitalConfig({
        name:          name || undefined,
        logoBase64:    logoBase64    || undefined,
        faviconBase64: faviconBase64 || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Эмнэлгийн мэдээлэл хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["hospital-config"] });
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Эмнэлгийн брэнд
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Нэр, лого, favicon — бүх хуудсанд харагдана
          </p>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Хадгалах
        </Button>
      </div>

      {/* Hospital name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Эмнэлгийн нэр</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Нэр</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MEDLIVER"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Нэвтрэх хуудас болон sidebar дээр харагдана
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Лого</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            PNG, JPG, SVG · Хамгийн ихдээ 2 MB · Зөвлөмж: 200×60px орчим
          </p>

          {/* Preview + upload */}
          <div className="flex items-start gap-4">
            {logoBase64 ? (
              <div className="relative flex-shrink-0">
                <div className="h-16 w-40 rounded-lg border border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoBase64} alt="logo" className="h-14 w-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => setLogoBase64("")}
                  className="absolute -top-2 -right-2 h-5 w-5 bg-white border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                Лого оруулаагүй
              </div>
            )}

            <div className="space-y-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => logoRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Файл сонгох
              </Button>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => readFile(e, 2 * 1024 * 1024, setLogoBase64)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Favicon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            PNG, ICO, SVG · Хамгийн ихдээ 256 KB · Зөвлөмж: 32×32px эсвэл 64×64px
          </p>

          <div className="flex items-start gap-4">
            {faviconBase64 ? (
              <div className="relative flex-shrink-0">
                <div className="h-12 w-12 rounded-lg border border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={faviconBase64} alt="favicon" className="h-10 w-10 object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => setFaviconBase64("")}
                  className="absolute -top-2 -right-2 h-5 w-5 bg-white border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground flex-shrink-0 text-center">
                Icon
              </div>
            )}

            <div className="space-y-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => faviconRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Файл сонгох
              </Button>
              <input
                ref={faviconRef}
                type="file"
                accept="image/png,image/x-icon,image/svg+xml,image/ico"
                className="sr-only"
                onChange={(e) => readFile(e, 256 * 1024, setFaviconBase64)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Урьдчилан харах</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
            {logoBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoBase64} alt="logo" className="h-10 object-contain max-w-[120px]" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="text-sm font-bold tracking-wide">{name || "MEDLIVER"}</div>
              <div className="text-xs text-muted-foreground">Эмнэлгийн систем</div>
            </div>
            {faviconBase64 && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faviconBase64} alt="favicon" className="h-4 w-4 object-contain" />
                <span>favicon</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
