export interface ComplaintOption {
  id: string;
  category: "complaint" | "location";
  name: string;
  isActive: boolean;
  order: number;
}

export interface ComplaintLine {
  complaintName: string;
  locationName: string;
  notes: string;
}

export interface PatientComplaint {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  lines: ComplaintLine[];
  createdAt: string;
}

export interface CreateComplaintInput {
  date: string;
  lines: ComplaintLine[];
}

export interface CreateComplaintOptionInput {
  category: "complaint" | "location";
  name: string;
}
