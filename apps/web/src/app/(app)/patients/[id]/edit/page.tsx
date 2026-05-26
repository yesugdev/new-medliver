"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PatientForm, type PatientFormValues } from "@/components/patient-form";
import { getPatient, updatePatient } from "@/lib/patients-api";
import { extractApiError } from "@/lib/api";

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatient(id),
  });

  const mutation = useMutation({
    mutationFn: (payload: PatientFormValues) => updatePatient(id, payload),
    onSuccess: () => {
      toast({ title: "Амжилттай", description: "Өвчтөний мэдээлэл шинэчлэгдлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["patient", id] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      router.replace(`/patients/${id}`);
    },
    onError: (err) => {
      toast({
        title: "Хадгалах боломжгүй",
        description: extractApiError(err),
        variant: "destructive",
      });
    },
  });

  if (isLoading || !patient) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allergiesText = (patient.allergies ?? []).join(", ");
  const chronicConditionsText = (patient.chronicConditions ?? []).join(", ");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/patients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="text-xs text-muted-foreground font-mono">{patient.patientCode}</div>
          <h1 className="text-2xl font-semibold tracking-tight">Мэдээлэл засах</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {patient.lastName} {patient.firstName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm
            defaultValues={{
              registerNumber: patient.registerNumber,
              lastName: patient.lastName,
              firstName: patient.firstName,
              gender: patient.gender,
              birthDate: patient.birthDate.split("T")[0],
              phone: patient.phone,
              email: patient.email ?? "",
              address: patient.address ?? "",
              bloodType: patient.bloodType ?? "",
              allergiesText,
              chronicConditionsText,
              emergencyName: patient.emergencyContact?.name ?? "",
              emergencyRelation: patient.emergencyContact?.relation ?? "",
              emergencyPhone: patient.emergencyContact?.phone ?? "",
              notes: patient.notes ?? "",
            }}
            onSubmit={(values) => mutation.mutate(values)}
            submitting={mutation.isPending}
            submitLabel="Хадгалах"
          />
        </CardContent>
      </Card>
    </div>
  );
}
