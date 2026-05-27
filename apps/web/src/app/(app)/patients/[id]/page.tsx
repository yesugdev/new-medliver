"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil, Phone, Mail, MapPin } from "lucide-react";
import { GENDER_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatient } from "@/lib/patients-api";
import { calculateAge, formatDateMn } from "@/lib/utils";
import { PatientVisits } from "@/components/patient-visits";
import { PatientInvoices } from "@/components/patient-invoices";
import { PatientVitals } from "@/components/patient-vitals";
import { PatientLabOrders } from "@/components/patient-lab-orders";
import { PatientMedicalHistory } from "@/components/patient-medical-history";
import { PatientTreatment } from "@/components/patient-treatment";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatient(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-20 text-center text-muted-foreground">Өвчтөн олдсонгүй</div>
    );
  }

  const age = calculateAge(patient.birthDate);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="text-xs text-muted-foreground font-mono">
              {patient.patientCode}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {patient.lastName} {patient.firstName}
            </h1>
            <div className="text-sm text-muted-foreground mt-1">
              {GENDER_LABELS_MN[patient.gender]}
              {age !== null ? ` · ${age} настай` : ""} ·{" "}
              <span className="font-mono">{patient.registerNumber}</span>
            </div>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/patients/${patient.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Засах
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* ── Personal info ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Хувийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Овог нэр" value={`${patient.lastName} ${patient.firstName}`} />
            <InfoRow label="Регистр" value={patient.registerNumber} mono />
            <InfoRow label="Хүйс" value={GENDER_LABELS_MN[patient.gender]} />
            <InfoRow label="Төрсөн огноо" value={formatDateMn(patient.birthDate)} />
            <InfoRow
              label="Утас"
              value={
                <span className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {patient.phone}
                </span>
              }
            />
            {patient.email ? (
              <InfoRow
                label="Имэйл"
                value={
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {patient.email}
                  </span>
                }
              />
            ) : null}
            {patient.address ? (
              <InfoRow
                label="Хаяг"
                value={
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {patient.address}
                  </span>
                }
              />
            ) : null}
            {patient.bloodType ? (
              <InfoRow label="Цусны бүлэг" value={patient.bloodType} />
            ) : null}
            {patient.attendingDoctorName ? (
              <InfoRow label="Хяналтын эмч" value={patient.attendingDoctorName} />
            ) : null}
          </CardContent>
        </Card>

        {/* ── Right column: health + emergency + notes ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Эрүүл мэнд</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Allergies */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Харшил</div>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((a) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Тэмдэглээгүй</span>
                )}
              </div>

              {/* Chronic conditions */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Архаг өвчин</div>
                {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.chronicConditions.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-xs"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Тэмдэглээгүй</span>
                )}
              </div>

              {/* Emergency contact – inline */}
              {patient.emergencyContact && (
                <div className="border-t pt-3 space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Яаралтай үед холбогдох
                  </div>
                  {[
                    { label: "Нэр",      value: patient.emergencyContact.name,     mono: false },
                    { label: "Хамаарал", value: patient.emergencyContact.relation, mono: false },
                    { label: "Утас",     value: patient.emergencyContact.phone,    mono: true  },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex gap-2 text-xs">
                      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                      <span className={mono ? "font-mono" : "font-medium"}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes – truncated */}
              {patient.notes && (
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Тэмдэглэл
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-4">
                    {patient.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PatientVitals patientId={patient.id} />

      <PatientMedicalHistory patientId={patient.id} />

      <PatientTreatment patientId={patient.id} />

      <PatientLabOrders patientId={patient.id} />
      <PatientVisits patientId={patient.id} />
      <PatientInvoices patientId={patient.id} />

      <div className="text-xs text-muted-foreground">
        Бүртгэсэн: {formatDateMn(patient.createdAt)} · Шинэчилсэн:{" "}
        {formatDateMn(patient.updatedAt)}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  );
}
