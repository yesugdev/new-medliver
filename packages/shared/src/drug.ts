export interface Drug {
  id: string;
  name: string;
  form: string;
  dosage: string;
  unit: string;
  stock: number;
  minStock: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDrugInput {
  name: string;
  form: string;
  dosage: string;
  unit: string;
  stock: number;
  minStock?: number;
  description?: string;
}

export interface UpdateDrugInput {
  name?: string;
  form?: string;
  dosage?: string;
  unit?: string;
  stock?: number;
  minStock?: number;
  description?: string;
  isActive?: boolean;
}

export interface AdjustStockInput {
  delta: number; // positive = add, negative = deduct
}
