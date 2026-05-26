"use client";

import { Shield } from "lucide-react";
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
            <li>Эмнэлгийн нэр, лого, хаяг, утасны мэдээлэл (settings collection)</li>
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
