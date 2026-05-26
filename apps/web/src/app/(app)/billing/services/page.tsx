"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import {
  SERVICE_CATEGORY_LABELS_MN,
  type ServiceCategory,
} from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  listServices,
  createService,
  updateService,
} from "@/lib/billing-api";
import { formatMnt } from "@/lib/format";
import { extractApiError } from "@/lib/api";

const CATS: ServiceCategory[] = [
  "consultation",
  "procedure",
  "lab",
  "imaging",
  "medication",
  "other",
];

export default function ServicesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("consultation");
  const [price, setPrice] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["services", false],
    queryFn: () => listServices(false),
  });

  const createMut = useMutation({
    mutationFn: () => createService({ code, name, category, price }),
    onSuccess: () => {
      toast({ title: "Үйлчилгээ нэмлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["services"] });
      setCode("");
      setName("");
      setPrice(0);
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateService(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Үйлчилгээний бүртгэл</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Шинэ үйлчилгээ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label>Код</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Нэр</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Ангилал</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ServiceCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {SERVICE_CATEGORY_LABELS_MN[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Үнэ (₮)</Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="md:col-span-5 flex justify-end">
              <Button
                onClick={() => createMut.mutate()}
                disabled={!code || !name || createMut.isPending}
              >
                Нэмэх
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бүх үйлчилгээ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Нэр</th>
                <th>Ангилал</th>
                <th className="text-right">Үнэ</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    Үйлчилгээ алга
                  </td>
                </tr>
              ) : (
                data.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.code}</td>
                    <td>{s.name}</td>
                    <td className="text-xs text-muted-foreground">
                      {SERVICE_CATEGORY_LABELS_MN[s.category]}
                    </td>
                    <td className="text-right font-medium">{formatMnt(s.price)}</td>
                    <td>
                      {s.isActive ? (
                        <Badge tone="success">Идэвхтэй</Badge>
                      ) : (
                        <Badge tone="muted">Идэвхгүй</Badge>
                      )}
                    </td>
                    <td className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toggleMut.mutate({ id: s.id, isActive: !s.isActive })
                        }
                      >
                        {s.isActive ? "Унтраах" : "Идэвхжүүлэх"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
