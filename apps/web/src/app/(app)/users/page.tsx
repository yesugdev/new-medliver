"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Loader2, Plus, KeyRound, UserCog } from "lucide-react";
import { ROLE_LABELS_MN, type Role, ROLES } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  listUsers,
  createUser,
  updateUser,
  resetUserPassword,
} from "@/lib/users-api";
import { formatDateTimeMn } from "@/lib/utils";
import { extractApiError } from "@/lib/api";

const ALL_ROLES: Role[] = Object.values(ROLES);

export default function UsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  // create form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>(ROLES.RECEPTION);
  const [phone, setPhone] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => listUsers({ search: search || undefined }),
  });

  const createMut = useMutation({
    mutationFn: () => createUser({ email, password, fullName, role, phone: phone || undefined }),
    onSuccess: () => {
      toast({ title: "Хэрэглэгч үүсгэлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["users"] });
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const resetPasswordPrompt = async (id: string) => {
    const np = window.prompt("Шинэ нууц үг (6+ тэмдэгт):");
    if (!np || np.length < 6) return;
    try {
      await resetUserPassword(id, np);
      toast({ title: "Нууц үг шинэчиллээ", variant: "success" });
    } catch (err) {
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Хэрэглэгчид
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Системийн хэрэглэгчид болон тэдгээрийн эрхийг удирдах
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Шинэ хэрэглэгч
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="space-y-1 md:col-span-2">
              <Label>Имэйл</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Бүтэн нэр</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Утас</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS_MN[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Нууц үг</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button
                onClick={() => createMut.mutate()}
                disabled={!email || !password || !fullName || createMut.isPending}
              >
                Үүсгэх
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Бүх хэрэглэгч</CardTitle>
          <Input
            placeholder="Хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </CardHeader>
        <CardContent className="p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Нэр</th>
                <th>Имэйл</th>
                <th>Role</th>
                <th>Утас</th>
                <th>Сүүлд орсон</th>
                <th>Төлөв</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    Хэрэглэгч алга
                  </td>
                </tr>
              ) : (
                data.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      {u.fullName}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <Badge tone="info">{ROLE_LABELS_MN[u.role]}</Badge>
                    </td>
                    <td className="font-mono text-xs">{u.phone ?? "—"}</td>
                    <td className="text-xs text-muted-foreground">
                      {u.lastLoginAt ? formatDateTimeMn(u.lastLoginAt) : "Хэзээ ч"}
                    </td>
                    <td>
                      {u.isActive ? (
                        <Badge tone="success">Идэвхтэй</Badge>
                      ) : (
                        <Badge tone="muted">Идэвхгүй</Badge>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resetPasswordPrompt(u.id)}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleMut.mutate({ id: u.id, isActive: !u.isActive })}
                        >
                          {u.isActive ? "Унтраах" : "Идэвхжүүлэх"}
                        </Button>
                      </div>
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
