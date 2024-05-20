export class SMTP {
  SNO!: number;
  From_Address!: string;
  SMTP_Address!: string;
  SMTP_Port!: string;
  SMTP_UName!: string;
  SMTP_Password!: string | null;
  Effective_Date!: string;
  AuditBy!: string | null;
  Audit_Date!: string | null;
  AuditAction!: string | null;
  AuditDone!: string | null;
  AuditID!: number;
  History!: string | null;
  SSL_Enable!: string;
  Ward_Status!: string | null;
}
