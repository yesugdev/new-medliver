import type {
  InstrumentalExamResult,
  InstrumentalExamFile,
  CreateInstrumentalExamResultInput,
  CreateInstrumentalExamFileInput,
  InstrumentalExamType,
} from "@his/shared";
import { api } from "./api";

const base = (pid: string) => `/patients/${pid}/instrumental`;

export const getExamResults = (pid: string, examType: InstrumentalExamType) =>
  api.get<InstrumentalExamResult[]>(`${base(pid)}/results`, { params: { examType } }).then((r) => r.data);

export const createExamResult = (pid: string, input: CreateInstrumentalExamResultInput) =>
  api.post<InstrumentalExamResult>(`${base(pid)}/results`, input).then((r) => r.data);

export const deleteExamResult = (pid: string, rid: string) =>
  api.delete(`${base(pid)}/results/${rid}`);

export const getExamFiles = (pid: string, examType: InstrumentalExamType) =>
  api.get<InstrumentalExamFile[]>(`${base(pid)}/files`, { params: { examType } }).then((r) => r.data);

export const createExamFile = (pid: string, input: CreateInstrumentalExamFileInput) =>
  api.post<InstrumentalExamFile>(`${base(pid)}/files`, input).then((r) => r.data);

export const deleteExamFile = (pid: string, fid: string) =>
  api.delete(`${base(pid)}/files/${fid}`);
