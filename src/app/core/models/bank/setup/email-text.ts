export class EmailText {
  SNO!: number;
  Flow_Id!: string;
  Email_Text!: string;
  Local_Text!: string;
  Subject!: string;
  Local_subject!: string;
  Effective_Date!: string;
  AuditBy!: string | null;
  Audit_Date!: string | null;
}

export class EmailTextFlow {
  label!: string;
  flow!: number;
}
