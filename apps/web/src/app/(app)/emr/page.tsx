"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Users, CalendarClock } from "lucide-react";

export default function EmrLandingPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Үзлэгийн карт (EMR)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Шинэ үзлэг эхлүүлэхийн тулд өвчтөн эсвэл өнөөдрийн дарааллаас нэвтэрнэ үү.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/queue">
          <Card className="hover:bg-muted/50 transition cursor-pointer h-full">
            <CardContent className="p-6">
              <CalendarClock className="h-8 w-8 text-primary mb-3" />
              <div className="font-semibold mb-1">Өнөөдрийн дараалал</div>
              <div className="text-sm text-muted-foreground">
                Хүлээж буй өвчтөнүүдийн жагсаалт. Тэндээс EMR-ыг шууд нээх боломжтой.
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patients">
          <Card className="hover:bg-muted/50 transition cursor-pointer h-full">
            <CardContent className="p-6">
              <Users className="h-8 w-8 text-primary mb-3" />
              <div className="font-semibold mb-1">Өвчтөнөөр хайх</div>
              <div className="text-sm text-muted-foreground">
                Өвчтөний жагсаалтаас сонгоод үзлэгийн түүхийг харах эсвэл шинэ үзлэг
                эхлүүлэх.
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
