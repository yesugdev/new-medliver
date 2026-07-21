"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Loader2, Save, ShieldCheck } from "lucide-react";
import { ALL_ROLES, ROLES, ROLE_LABELS_MN, type Role } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth-guard";
import { getReportAccess, updateReportAccess } from "@/lib/report-access-api";
import { extractApiError } from "@/lib/api";

function ReportsAccessInner() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Role[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["report-access"],
    queryFn: getReportAccess,
  });

  useEffect(() => {
    if (data) setSelected(data.roles);
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateReportAccess(selected),
    onSuccess: () => {
      toast({ title: "Хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["report-access"] });
    },
    onError: (e) => toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const toggle = (role: Role) =>
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  // admin-г жагсаалтаас тусад нь (үргэлж идэвхтэй, унтраах боломжгүй)
  const configurable = ALL_ROLES.filter((r) => r !== ROLES.ADMIN);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Тайлангийн хандалт
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Тайлан модулийг аль эрхийн хэрэглэгчид харахыг сонгоно
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Харах эрхтэй хэрэглэгчид</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Admin — үргэлж идэвхтэй */}
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <input type="checkbox" checked disabled className="h-4 w-4 accent-primary rounded" />
                <span className="text-sm font-medium flex items-center gap-1.5">
                  {ROLE_LABELS_MN.admin}
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                </span>
                <span className="ml-auto text-xs text-muted-foreground">Үргэлж харагдана</span>
              </div>

              {configurable.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(role)}
                    onChange={() => toggle(role)}
                    className="h-4 w-4 accent-primary rounded"
                  />
                  <span className="text-sm">{ROLE_LABELS_MN[role]}</span>
                </label>
              ))}

              <div className="pt-2">
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Хадгалах
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsAccessPage() {
  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN]}>
      <ReportsAccessInner />
    </AuthGuard>
  );
}
