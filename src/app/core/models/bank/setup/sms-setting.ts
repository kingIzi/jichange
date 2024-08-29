import { EmailText } from './email-text';
import { SMTP } from './smtp';

export class SmsSetting extends SMTP {
  Mobile_Service!: string | null | undefined;
}

export class SmsSettingsData {
  SNO!: number;
  USER_Name!: string;
  Password!: string;
  From_Address!: string;
  Mobile_Service!: string;
  Effective_Date!: string;
  AuditBy!: string | number | null | undefined;
  Audit_Date!: string | number | null | undefined;
}
