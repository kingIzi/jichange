export class InvoiceReportFormBanker {
  branch!: number | string;
  Comp!: number | string;
  cusid!: number | string;
  stdate!: string | null;
  enddate!: string | null;
}

export class InvoiceReportFormVendor {
  Comp!: number | string;
  cusid!: number | string;
  stdate!: string | null;
  enddate!: string | null;
}
