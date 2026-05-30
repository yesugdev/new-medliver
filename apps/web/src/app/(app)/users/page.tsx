"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Loader2, Plus, KeyRound, UserCog, Pencil, X, Eye, EyeOff,
} from "lucide-react";
import { ROLE_LABELS_MN, type Role, ROLES, type SystemUser } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { listUsers, createUser, updateUser, resetUserPassword } from "@/lib/users-api";
import { formatDateTimeMn } from "@/lib/utils";
import { extractApiError } from "@/lib/api";

const ALL_ROLES: Role[] = Object.values(ROLES);

/* ─── Edit slide-panel ───────────────────────────────────────────────── */
function EditPanel({
  user,
  onClose,
}: {
  user: SystemUser;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user.fullName);
  const [role,     setRole]     = useState<Role>(user.role as Role);
  const [phone,    setPhone]    = useState(user.phone ?? "");
  const [isActive, setIsActive] = useState(user.isActive);

  const [newPw,      setNewPw]      = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [pwLoading,  setPwLoading]  = useState(false);

  /* sync when user prop changes */
  useEffect(() => {
    setFullName(user.fullName);
    setRole(user.role as Role);
    setPhone(user.phone ?? "");
    setIsActive(user.isActive);
    setNewPw("");
  }, [user.id]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateUser(user.id, {
        fullName,
        role,
        phone: phone || undefined,
        isActive,
      }),
    onSuccess: () => {
      toast({ title: "Хадгаллаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const handleResetPw = async () => {
    if (!newPw || newPw.length < 6) {
      toast({ title: "Нууц үг 6+ тэмдэгт байх ёстой", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    try {
      await resetUserPassword(user.id, newPw);
      toast({ title: "Нууц үг шинэчиллээ", variant: "success" });
      setNewPw("");
    } catch (err) {
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Хэрэглэгч засах</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Email — read only */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Имэйл (өөрчлөх боломжгүй)</Label>
            <div className="h-9 rounded-md border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground font-mono">
              {user.email}
            </div>
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <Label>Бүтэн нэр <span className="text-destructive">*</span></Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Овог нэр"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Эрх (Role)</Label>
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

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>Утас</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="99112233"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <div className="text-sm font-medium">Идэвхтэй эсэх</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Идэвхгүй болгосон хэрэглэгч нэвтрэх боломжгүй
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Save */}
          <Button
            className="w-full"
            onClick={() => saveMut.mutate()}
            disabled={!fullName || saveMut.isPending}
          >
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Хадгалах
          </Button>

          {/* Divider */}
          <div className="border-t border-border pt-4">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Нууц үг шинэчлэх
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Шинэ нууц үг (6+)"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                onClick={handleResetPw}
                disabled={!newPw || newPw.length < 6 || pwLoading}
              >
                {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Солих"}
              </Button>
            </div>
            {newPw && newPw.length < 6 && (
              <p className="text-xs text-destructive mt-1">6-аас дээш тэмдэгт байх ёстой</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function UsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<SystemUser | null>(null);

  /* Create form state */
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role,     setRole]     = useState<Role>(ROLES.RECEPTION);
  const [phone,    setPhone]    = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => listUsers({ search: search || undefined }),
  });

  const createMut = useMutation({
    mutationFn: () => createUser({ email, password, fullName, role, phone: phone || undefined }),
    onSuccess: () => {
      toast({ title: "Хэрэглэгч үүсгэлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["users"] });
      setEmail(""); setPassword(""); setFullName(""); setPhone("");
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Edit panel */}
      {editUser && (
        <EditPanel user={editUser} onClose={() => setEditUser(null)} />
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Хэрэглэгчид
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Системийн хэрэглэгчид болон тэдгээрийн эрхийг удирдах
        </p>
      </div>

      {/* Create form */}
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS_MN[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Нууц үг</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button
                onClick={() => createMut.mutate()}
                disabled={!email || !password || !fullName || createMut.isPending}
              >
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Үүсгэх
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
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
                <th>Сүүлд нэвтэрсэн</th>
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
                  <tr
                    key={u.id}
                    className={editUser?.id === u.id ? "bg-primary/5" : ""}
                  >
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-muted-foreground shrink-0" />
                        {u.fullName}
                      </div>
                    </td>
                    <td className="text-sm text-muted-foreground">{u.email}</td>
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setEditUser(u)}
                      >
                        <Pencil className="h-3 w-3" />
                        Засах
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
