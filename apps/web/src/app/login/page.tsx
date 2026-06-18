"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { loginRequest } from "@/lib/auth-api";
import { extractApiError } from "@/lib/api";
import { getHospitalConfig } from "@/lib/hospital-config-api";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const existingUser = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { data: branding } = useQuery({
    queryKey: ["hospital-config"],
    queryFn: getHospitalConfig,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (existingUser) router.replace("/dashboard");
  }, [existingUser, router]);

  const mutation = useMutation({
    mutationFn: () => loginRequest({ email, password }),
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      toast({ title: "Тавтай морилно уу", description: data.user.fullName, variant: "success" });
      router.replace("/dashboard");
    },
    onError: (err) => {
      toast({
        title: "Нэвтрэх боломжгүй",
        description: extractApiError(err, "Имэйл эсвэл нууц үг буруу байна"),
        variant: "destructive",
      });
    },
  });

  const hospitalName = branding?.name || "MEDLIVER";
  const logoSrc      = branding?.logoBase64;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="flex items-center justify-center mb-8 gap-3">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={hospitalName} className="h-12 max-w-[180px] object-contain" />
          ) : (
            <>
              <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-wide">{hospitalName}</div>
                <div className="text-xs text-muted-foreground">Эмнэлгийн мэдээллийн систем</div>
              </div>
            </>
          )}
        </div>
        {logoSrc && (
          <p className="text-center text-sm text-muted-foreground -mt-4 mb-6">
            Эмнэлгийн мэдээллийн систем
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Нэвтрэх</CardTitle>
            <CardDescription>Хэрэглэгчийн нэр, нууц үгээ оруулна уу</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Имэйл хаяг</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hospital.mn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Нууц үг</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Нэвтэрч байна...
                  </>
                ) : (
                  "Нэвтрэх"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} {hospitalName} · Эмнэлгийн мэдээллийн систем
        </p>
      </div>
    </div>
  );
}
