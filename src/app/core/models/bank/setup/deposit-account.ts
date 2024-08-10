export class DepositAccount {
  Comp_Dep_Acc_Sno!: number;
  Deposit_Acc_No!: string;
  Comp_Mas_Sno!: number;
  AuditBy!: string | null;
  Reason!: string | null;
  Company!: string;
  Audit_Date!: string | null;
}

export class BankAccount {
  AuditBy!: number | string;
  Audit_Date!: number | string;
  Comp_Dep_Acc_Sno!: number | string;
  Comp_Mas_Sno!: number | string;
  Company!: number | string;
  Deposit_Acc_No!: number | string;
  Reason!: number | string;
}
