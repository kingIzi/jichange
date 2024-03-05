export class Customer {
  Cust_Sno!: number;
  CompanySno!: number;
  Cust_Name!: string;
  PostboxNo!: string;
  Address!: string;
  Region_SNO?: number | null;
  Region_Name?: string | null;
  DistSno?: number | null;
  DistName?: string | null;
  WardSno?: number | null;
  WardName?: string | null;
  TinNo!: string;
  VatNo!: string;
  ConPerson!: string;
  Email!: string;
  Phone!: string;
  Checker?: string | null;
  Posted_by?: string | null;
  Posted_Date!: Date;
}
