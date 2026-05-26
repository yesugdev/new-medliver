"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { APPOINTMENT_TYPE_LABELS_MN, type AppointmentType } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { listPatients } from "@/lib/patients-api";
import { listDoctors } from "@/lib/users-api";
import { createAppointment } from "@/lib/appointments-api";
import { toDateTimeInput } from "@/lib/format";
import { extractApiError } from "@/lib/api";

const TYPES: AppointmentType[] = ["consultation", "follow_up", "walk_in", "emergency"];

export default function NewAppointmentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(toDateTimeInput(new Date(Date.now() + 30 * 60_000)));
  const [duration, setDuration] = useState(20);
  const [type, setType] = useState<AppointmentType>("consultation");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const patients = useQuery({
    queryKey: ["patient-search", search],
    queryFn: () => listPatients({ search: search || undefined, pageSize: 8 }),
    enabled: search.length > 0,
  });

  const doctors = useQuery({
    queryKey: ["doctors"],
    queryFn: listDoctors,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createAppointment({
        patientId,
        doctorId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: duration,
        type,
        reason: reason || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Цаг үүсгэлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      router.replace("/appointments");
    },
    onError: (err) =>
      toast({
        title: "Алдаа",
        description: extractApiError(err),
        variant: "destructive",
      }),
  });

  const canSubmit = patientId && doctorId && scheduledAt;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/appointments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Шинэ цаг захиалах</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Захиалгын мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Өвчтөн *</Label>
            {patientId ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-md border bg-muted/30 text-sm">
                  {patientName}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPatientId("");
                    setPatientName("");
                    setSearch("");
                  }}
                >
                  Солих
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Нэр, регистр, утсаар хайх..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {patients.data && patients.data.items.length > 0 ? (
                  <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                    {patients.data.items.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => {
                          setPatientId(p.id);
                          setPatientName(`${p.lastName} ${p.firstName} · ${p.patientCode}`);
                        }}
                      >
                        <div className="font-medium">
                          {p.lastName} {p.firstName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {p.patientCode} · {p.registerNumber} · {p.phone}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Эмч *</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Эмч сонгох" />
              </SelectTrigger>
              <SelectContent>
                {doctors.data?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Огноо, цаг *</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Үргэлжлэх (минут)</Label>
              <Input
                type="number"
                min={5}
                max={240}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 20)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Төрөл</Label>
            <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {APPOINTMENT_TYPE_LABELS_MN[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Үзлэгийн шалтгаан</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Тэмдэглэл</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                "Цаг үүсгэх"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
