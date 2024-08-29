import { FormArray, FormControl } from '@angular/forms';

export interface ReportFormInvoiceDetails {
  compid: FormControl<number | string | null | undefined>;
  cusid: FormControl<number | string | null | undefined>;
  branch: FormControl<number | string | null | undefined>;
  stdate: FormControl<string | null | undefined>;
  enddate: FormControl<string | null | undefined>;
  invno: FormControl<string | null | undefined>;
}
