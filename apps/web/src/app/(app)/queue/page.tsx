"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlayCircle, CheckCircle2, Stethoscope } from "lucide-react";
import { APPOINTMENT_STATUS_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { getQueue, appointmentAction } from "@/lib/appointments-api";
import { APPOINTMENT_TONE } from "@/lib/status-tones";
import { formatTimeMn } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import { extractApiError } from "@/lib/api";

export default function QueuePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["queue"],
    queryFn: () => getQueue(),
    refetchInterval: 10_000,
  });

  const action = useMutation({
    mutationFn: ({ id, act }: { id: string; act: "start" | "complete" }) =>
      appointmentAction(id, act),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Шинэчиллээ", variant: "success" });
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const canAct = user && (user.role === "admin" || user.role === "doctor");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Өнөөдрийн дараалал
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.role === "doctor" ? "Таны өдрийн өвчтөнүүд" : "Хүлээж буй бүх өвчтөн"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Хүлээж буй өвчтөн алга
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-3xl font-bold">#{a.queueNumber ?? "—"}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTimeMn(a.scheduledAt)}
                  </div>
                </div>
                <Badge tone={APPOINTMENT_TONE[a.status]}>
                  {APPOINTMENT_STATUS_LABELS_MN[a.status]}
                </Badge>
              </div>
              <Link
                href={`/patients/${a.patientId}`}
                className="block hover:underline mb-1"
              >
                <div className="font-medium">{a.patientName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {a.patientCode}
                </div>
              </Link>
              <div className="text-xs text-muted-foreground mb-3">
                Эмч: {a.doctorName}
              </div>
              {a.reason ? (
                <div className="text-sm bg-muted/40 rounded p-2 mb-3">
                  {a.reason}
                </div>
              ) : null}
              {canAct ? (
                <div className="flex gap-2">
                  {a.status === "waiting" ? (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => action.mutate({ id: a.id, act: "start" })}
                    >
                      <PlayCircle className="h-4 w-4" />
                      Үзлэг эхлүүлэх
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/emr/visit?appointmentId=${a.id}&patientId=${a.patientId}`}>
                          EMR нээх
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => action.mutate({ id: a.id, act: "complete" })}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
