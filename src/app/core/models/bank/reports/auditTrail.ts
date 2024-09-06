export class AuditTrail {
  ovalue!: string;
  nvalue!: string;
  atype!: string;
  colname!: string;
  aby!: string;
  adate!: string;
}

export interface AuditTrailLogData {
  Audit_Sno: number;
  Audit_Type: string;
  Table_Name: string;
  ColumnsName: string;
  OldValues?: string;
  NewValues?: string;
  AuditBy?: string;
  AuditorName?: string;
  ipAddress?: string;
  Audit_Date: string;
}

export interface ResultsSet {
  size: number;
  content: AuditTrailLogData[];
}
