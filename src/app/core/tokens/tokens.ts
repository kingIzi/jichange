import { InjectionToken } from '@angular/core';
import { TableDataService } from '../services/table-data.service';
import { Branch } from '../models/bank/setup/branch';
import { Country } from 'src/app/core/models/bank/setup/country';
import { Region } from 'src/app/core/models/bank/setup/region';
import { District } from 'src/app/core/models/bank/setup/district';
import { Ward } from '../models/bank/setup/ward';
import { Currency } from '../models/bank/setup/currency';
import { Designation } from '../models/bank/setup/designation';
import { SMTP } from '../models/bank/setup/smtp';
import { EmailText } from '../models/bank/setup/email-text';
import { EmployeeDetail } from '../models/bank/setup/employee-detail';
import { SuspenseAccount } from '../models/bank/setup/suspense-account';
import { Customer as VendorCustomer } from 'src/app/core/models/vendors/customer';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';

export const TABLE_DATA_SERVICE = new InjectionToken<
  TableDataService<
    | Branch
    | Country
    | Region
    | District
    | Ward
    | Currency
    | Designation
    | SMTP
    | EmailText
    | EmployeeDetail
    | SuspenseAccount
  >
>('TABLE_DATA_SERVICE');

export const VENDOR_TABLE_DATA_SERVICE = new InjectionToken<
  TableDataService<VendorCustomer | InvoiceReport>
>('VENDOR_TABLE_DATA_SERVICE');
