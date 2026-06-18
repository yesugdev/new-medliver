"use client";

import Link from "next/link";
import { Shield, FileText, ChevronRight, Stethoscope, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Системийн тохиргоо
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Эмнэлгийн системийн ерөнхий тохиргоо
        </p>
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle>Тохиргоо</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Link
            href="/settings/hospital"
            className="flex items-center gap-3 px-6 py-4 hover:bg-muted/40 transition-colors border-b border-border last:border-0"
          >
            <Building2 className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Эмнэлгийн брэнд</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Нэр, лого, favicon тохируулах
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
          <Link
            href="/settings/emr-template"
            className="flex items-center gap-3 px-6 py-4 hover:bg-muted/40 transition-colors border-b border-border last:border-0"
          >
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">EMR загвар тохиргоо</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Үзлэгийн картын tab, section, талбаруудыг тохируулах
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
          <Link
            href="/settings/complaint-options"
            className="flex items-center gap-3 px-6 py-4 hover:bg-muted/40 transition-colors border-b border-border last:border-0"
          >
            <Stethoscope className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Зовуурийн сонголтууд</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Зовуурь, байрлалын dropdown сонголтуудыг нэмэх, хасах
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Систем</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Хувилбар" value="v0.1.0 (MVP)" />
          <Row label="Backend" value="NestJS 10 / Node 20+" />
          <Row label="Frontend" value="Next.js 15 / React 19" />
          <Row label="DB" value="MongoDB 7" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Дараагийн iteration-д нэмэгдэх боломжтой</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1.5 text-muted-foreground list-disc list-inside">
            <li>Multi-branch дэмжлэг</li>
            <li>SMS gateway тохиргоо</li>
            <li>Laboratory, Pharmacy интеграцийн endpoint-ууд</li>
            <li>Бүртгэлийн backup төлөвлөгөө</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
