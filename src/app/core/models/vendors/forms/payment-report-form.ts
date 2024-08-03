export class PaymentDetailReportForm {
  compid!: number;
  cust!: string;
  stdate!: string;
  enddate!: string;
  invno!: string;
}

export class InvoiceDetailsForm {
  companyIds!: number[];
  customerIds!: number[];
  invoiceIds!: number[];
  stdate!: string;
  enddate!: string;
}
