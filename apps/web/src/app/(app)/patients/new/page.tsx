"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PatientForm, type PatientFormValues } from "@/components/patient-form";
import { createPatient } from "@/lib/patients-api";
import { extractApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function NewPatientPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const canSetDoctor = user?.role === "admin" || user?.role === "reception";

  const mutation = useMutation({
    mutationFn: (payload: PatientFormValues) => createPatient(payload),
    onSuccess: (data) => {
      toast({
        title: "Амжилттай",
        description: `${data.lastName} ${data.firstName} бүртгэгдлээ (${data.patientCode})`,
        variant: "success",
      });
      qc.invalidateQueries({ queryKey: ["patients"] });
      router.replace(`/patients/${data.id}`);
    },
    onError: (err) => {
      toast({
        title: "Бүртгэх боломжгүй",
        description: extractApiError(err, "Серверийн алдаа гарлаа"),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Шинэ өвчтөн бүртгэх</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Заавал шаардлагатай талбаруудыг бөглөнө үү
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Хувийн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm
            onSubmit={(values) => mutation.mutate(values)}
            submitting={mutation.isPending}
            submitLabel="Бүртгэх"
            canSetDoctor={canSetDoctor}
          />
        </CardContent>
      </Card>
    </div>
  );
}
