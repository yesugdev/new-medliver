"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera, Check, Eye, EyeOff, KeyRound, Loader2, Mail,
  Phone, Save, Shield, UserCircle,
} from "lucide-react";
import { ROLE_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { getMe, updateMe, changeMyPassword } from "@/lib/users-api";
import { extractApiError } from "@/lib/api";
import { formatDateTimeMn } from "@/lib/utils";

/* ─── Role badge colour ──────────────────────────────────────────── */
const ROLE_TONE: Record<string, string> = {
  admin:     "bg-red-100 text-red-800",
  manager:   "bg-purple-100 text-purple-800",
  doctor:    "bg-blue-100 text-blue-800",
  nurse:     "bg-green-100 text-green-800",
  reception: "bg-amber-100 text-amber-800",
};

/* ─── Avatar upload ──────────────────────────────────────────────── */
function AvatarUpload({
  current,
  initials,
  onSelect,
}: {
  current?: string;
  initials: string;
  onSelect: (base64: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(current);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB cap
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setPreview(b64);
      onSelect(b64);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative w-fit">
      <div
        onClick={() => fileRef.current?.click()}
        className="h-24 w-24 rounded-full overflow-hidden bg-primary/10 border-2 border-border cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
      >
        {preview ? (
          <img src={preview} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-primary select-none">{initials}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center shadow border-2 border-white hover:bg-primary/90 transition-colors"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function ProfilePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((s) => s.user);
  const setUser  = useAuthStore((s) => s.setUser);

  /* Profile data */
  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  /* Info form state */
  const [fullName,   setFullName]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [avatarB64,  setAvatarB64]  = useState<string | undefined>();
  const [infoReady,  setInfoReady]  = useState(false);

  /* Populate once */
  if (profile && !infoReady) {
    setFullName(profile.fullName);
    setPhone(profile.phone ?? "");
    setAvatarB64(profile.avatar);
    setInfoReady(true);
  }

  /* Password form state */
  const [curPwd,     setCurPwd]     = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);

  /* Save profile mutation */
  const saveInfo = useMutation({
    mutationFn: () =>
      updateMe({
        fullName:  fullName.trim() || undefined,
        phone:     phone.trim()    || undefined,
        avatar:    avatarB64,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["me"], updated);
      if (authUser) setUser({ ...authUser, fullName: updated.fullName });
      toast({ title: "Хадгаллаа", variant: "success" });
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  /* Change password mutation */
  const changePwd = useMutation({
    mutationFn: () =>
      changeMyPassword({ currentPassword: curPwd, newPassword: newPwd }),
    onSuccess: () => {
      setCurPwd(""); setNewPwd(""); setConfirmPwd("");
      toast({ title: "Нууц үг солигдлоо", variant: "success" });
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const initials = profile
    ? (profile.fullName[0] ?? "?").toUpperCase()
    : (authUser?.fullName[0] ?? "?").toUpperCase();

  const pwdOk =
    curPwd.length >= 6 &&
    newPwd.length >= 6 &&
    newPwd === confirmPwd;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Миний профайл</h1>

      {/* ── Profile card ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Хувийн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + role row */}
          <div className="flex items-center gap-5">
            <AvatarUpload
              current={profile?.avatar}
              initials={initials}
              onSelect={setAvatarB64}
            />
            <div className="space-y-1">
              <div className="text-lg font-semibold">{profile?.fullName}</div>
              <div className="text-sm text-muted-foreground">{profile?.email}</div>
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${profile?.role ? (ROLE_TONE[profile.role] ?? "") : ""}`}>
                {profile?.role ? ROLE_LABELS_MN[profile.role] : ""}
              </span>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Бүтэн нэр</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Нэр"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Имэйл <span className="text-xs text-muted-foreground">(өөрчлөх боломжгүй)</span>
              </Label>
              <Input value={profile?.email ?? ""} disabled className="bg-muted/40" />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Утасны дугаар
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="99XXXXXX"
              />
            </div>
          </div>

          {/* Meta info */}
          {profile?.lastLoginAt && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              Сүүлд нэвтэрсэн: {formatDateTimeMn(profile.lastLoginAt)}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => saveInfo.mutate()}
              disabled={saveInfo.isPending || !fullName.trim()}
            >
              {saveInfo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Хадгалах
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Password change card ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            Нууц үг солих
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current password */}
          <div className="space-y-1.5">
            <Label>Одоогийн нууц үг</Label>
            <div className="relative">
              <Input
                type={showCur ? "text" : "password"}
                value={curPwd}
                onChange={(e) => setCurPwd(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCur((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label>Шинэ нууц үг</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <Label>Нууц үг давтах</Label>
            <div className="relative">
              <Input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="••••••••"
                className={confirmPwd && confirmPwd !== newPwd ? "border-destructive pr-10" : "pr-10"}
              />
              {confirmPwd && confirmPwd === newPwd && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {confirmPwd && confirmPwd !== newPwd && (
              <p className="text-xs text-destructive">Нууц үг таарахгүй байна</p>
            )}
          </div>

          {/* Strength hint */}
          <div className="flex items-center gap-1.5">
            {[6, 8, 12].map((len, i) => (
              <div
                key={len}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  newPwd.length >= len
                    ? i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-green-500"
                    : "bg-border"
                }`}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">
              {newPwd.length === 0 ? "" : newPwd.length < 6 ? "Богино" : newPwd.length < 8 ? "Хангалттай" : newPwd.length < 12 ? "Сайн" : "Маш сайн"}
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => changePwd.mutate()}
              disabled={changePwd.isPending || !pwdOk}
            >
              {changePwd.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Нууц үг солих
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Account info ─────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserCircle className="h-4 w-4" />
            <span>Бүртгэсэн: {formatDateTimeMn(profile?.createdAt ?? "")}</span>
            {profile?.isActive ? (
              <span className="ml-auto text-green-600 font-medium flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" /> Идэвхтэй
              </span>
            ) : (
              <span className="ml-auto text-destructive font-medium">Идэвхгүй</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
