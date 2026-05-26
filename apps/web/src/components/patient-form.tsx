"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const phoneRegex = /^[0-9+\-\s()]{6,20}$/;

const schema = z.object({
  registerNumber: z
    .string()
    .min(10, "10 тэмдэгт байх ёстой")
    .max(10, "10 тэмдэгт байх ёстой")
    .regex(/^[А-ЯӨҮЁA-Z0-9]{10}$/i, "Зөвхөн үсэг, тоо"),
  lastName: z.string().min(1, "Заавал бөглөнө").max(50),
  firstName: z.string().min(1, "Заавал бөглөнө").max(50),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Хүйс сонгоно уу",
  }),
  birthDate: z.string().min(1, "Заавал бөглөнө"),
  phone: z.string().regex(phoneRegex, "Утасны дугаар буруу"),
  email: z.string().email("Имэйл буруу").optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  bloodType: z.string().max(5).optional().or(z.literal("")),
  allergiesText: z.string().optional().or(z.literal("")),
  chronicConditionsText: z.string().optional().or(z.literal("")),
  emergencyName: z.string().max(100).optional().or(z.literal("")),
  emergencyRelation: z.string().max(50).optional().or(z.literal("")),
  emergencyPhone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || phoneRegex.test(v), "Утасны дугаар буруу"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type FormSchema = z.infer<typeof schema>;

export interface PatientFormValues {
  registerNumber: string;
  lastName: string;
  firstName: string;
  gender: "male" | "female" | "other";
  birthDate: string;
  phone: string;
  email?: string;
  address?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: { name: string; relation: string; phone: string };
  notes?: string;
}

export function PatientForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel,
}: {
  defaultValues?: Partial<FormSchema>;
  onSubmit: (values: PatientFormValues) => void;
  submitting?: boolean;
  submitLabel: string;
}) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      registerNumber: "",
      lastName: "",
      firstName: "",
      gender: "male" as const,
      birthDate: "",
      phone: "",
      email: "",
      address: "",
      bloodType: "",
      allergiesText: "",
      chronicConditionsText: "",
      emergencyName: "",
      emergencyRelation: "",
      emergencyPhone: "",
      notes: "",
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const gender = watch("gender");

  const submit = handleSubmit((values) => {
    const allergies = (values.allergiesText ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const chronicConditions = (values.chronicConditionsText ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const emergencyContact =
      values.emergencyName && values.emergencyRelation && values.emergencyPhone
        ? {
            name: values.emergencyName,
            relation: values.emergencyRelation,
            phone: values.emergencyPhone,
          }
        : undefined;

    onSubmit({
      registerNumber: values.registerNumber.toUpperCase(),
      lastName: values.lastName,
      firstName: values.firstName,
      gender: values.gender,
      birthDate: values.birthDate,
      phone: values.phone,
      email: values.email || undefined,
      address: values.address || undefined,
      bloodType: values.bloodType || undefined,
      allergies: allergies.length ? allergies : undefined,
      chronicConditions: chronicConditions.length ? chronicConditions : undefined,
      emergencyContact,
      notes: values.notes || undefined,
    });
  });

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Овог" error={errors.lastName?.message} required>
            <Input {...register("lastName")} />
          </Field>
          <Field label="Нэр" error={errors.firstName?.message} required>
            <Input {...register("firstName")} />
          </Field>
          <Field label="Регистрийн дугаар" error={errors.registerNumber?.message} required>
            <Input {...register("registerNumber")} placeholder="УУ12345678" maxLength={10} />
          </Field>
          <Field label="Утас" error={errors.phone?.message} required>
            <Input {...register("phone")} placeholder="99112233" />
          </Field>
          <Field label="Хүйс" error={errors.gender?.message} required>
            <Select value={gender} onValueChange={(v) => setValue("gender", v as FormSchema["gender"])}>
              <SelectTrigger>
                <SelectValue placeholder="Сонгох" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Эрэгтэй</SelectItem>
                <SelectItem value="female">Эмэгтэй</SelectItem>
                <SelectItem value="other">Бусад</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Төрсөн огноо" error={errors.birthDate?.message} required>
            <Input type="date" {...register("birthDate")} />
          </Field>
          <Field label="Имэйл" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Цусны бүлэг" error={errors.bloodType?.message}>
            <Input {...register("bloodType")} placeholder="A+, O-, ..." />
          </Field>
        </div>
        <Field label="Гэрийн хаяг" error={errors.address?.message}>
          <Input {...register("address")} />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Эрүүл мэндийн нэмэлт мэдээлэл</h3>
        <Field
          label="Харшил"
          hint="Таслалаар тусгаарлана уу (жишээ: Пенициллин, Шарсан мах)"
          error={errors.allergiesText?.message}
        >
          <Input {...register("allergiesText")} />
        </Field>
        <Field
          label="Архаг өвчин"
          hint="Таслалаар тусгаарлана уу"
          error={errors.chronicConditionsText?.message}
        >
          <Input {...register("chronicConditionsText")} />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Яаралтай үед холбогдох</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Нэр" error={errors.emergencyName?.message}>
            <Input {...register("emergencyName")} />
          </Field>
          <Field label="Хамаарал" error={errors.emergencyRelation?.message}>
            <Input {...register("emergencyRelation")} placeholder="Эцэг, эх, ах..." />
          </Field>
          <Field label="Утас" error={errors.emergencyPhone?.message}>
            <Input {...register("emergencyPhone")} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <Field label="Тэмдэглэл" error={errors.notes?.message}>
          <Textarea rows={3} {...register("notes")} />
        </Field>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
