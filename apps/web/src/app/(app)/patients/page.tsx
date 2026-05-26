"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { GENDER_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { listPatients } from "@/lib/patients-api";
import { calculateAge, formatDateMn } from "@/lib/utils";

export default function PatientsListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["patients", { search, page, pageSize }],
    queryFn: () => listPatients({ search: search || undefined, page, pageSize }),
    placeholderData: (prev) => prev,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5" />
            Өвчтөн
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Бүртгэлтэй өвчтөнүүдийн жагсаалт
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <Plus className="h-4 w-4" />
            Шинэ өвчтөн
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Нэр, утас, регистрээр хайх..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Өвчтөний код</th>
                <th>Овог нэр</th>
                <th>Регистр</th>
                <th>Хүйс</th>
                <th>Нас</th>
                <th>Утас</th>
                <th>Бүртгэсэн огноо</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/patients/${p.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {p.patientCode}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/patients/${p.id}`} className="hover:underline">
                        {p.lastName} {p.firstName}
                      </Link>
                    </td>
                    <td className="font-mono text-xs">{p.registerNumber}</td>
                    <td>{GENDER_LABELS_MN[p.gender]}</td>
                    <td>{calculateAge(p.birthDate) ?? "—"}</td>
                    <td className="font-mono text-xs">{p.phone}</td>
                    <td className="text-muted-foreground">{formatDateMn(p.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Өвчтөн олдсонгүй
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
            <span className="text-muted-foreground">
              Нийт {data.total} өвчтөн · хуудас {data.page}/{totalPages}
              {isFetching ? " · шинэчилж байна..." : ""}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Өмнөх
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Дараах
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
