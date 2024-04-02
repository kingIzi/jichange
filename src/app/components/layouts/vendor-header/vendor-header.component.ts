import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageSelectorComponent } from '../../language-selector/language-selector.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-vendor-header',
  templateUrl: './vendor-header.component.html',
  styleUrls: ['./vendor-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LanguageSelectorComponent,
    TranslocoModule,
    ReactiveFormsModule,
  ],
})
export class VendorHeaderComponent implements OnInit {
  public routeLoading: boolean = false;
  public formGroup!: FormGroup;
  private headersMap = {
    customers: 0,
    invoiceDetails: 1,
    generatedInvoice: 2,
    reports: 3,
  };
  private reportsMap = {
    overview: 0,
    transactionDetails: 1,
    invoiceDetails: 2,
    customerDetailReport: 3,
    userLogReport: 4,
    auditTrails: 5,
  };
  constructor(
    private translocoService: TranslocoService,
    private fb: FormBuilder
  ) {}
  ngOnInit(): void {
    this.createHeaders();
  }
  private switchRouterLinks(ind: number) {
    switch (ind) {
      case 0:
        return '/vendor/customers';
      case 1:
        return '/vendor/invoice';
      case 2:
        return '/vendor/generated';
      case 3:
        return '/vendor/reports';
      default:
        return '/vendor';
    }
  }
  private createHeaders() {
    this.formGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
      .selectTranslate('vendorHeaders')
      .subscribe((headers: any[]) => {
        headers.forEach((header, index) => {
          let group = this.fb.group({
            label: this.fb.control(header.name, []),
            dropdowns: this.fb.array([], []),
            rootLink: this.fb.control(this.switchRouterLinks(index), []),
          });
          (header.dropdowns as any[]).forEach((e, dropdownIndex) => {
            let dropdown = this.fb.group({
              label: this.fb.control(e, []),
              routerLink: this.fb.control(
                this.getHeaderRouterLink(index, dropdownIndex),
                []
              ),
              isActive: this.fb.control(false, []),
            });
            (group.get('dropdowns') as FormArray).push(dropdown);
          });
          this.headers.push(group);
        });
      });
  }
  private getHeaderRouterLink(bankIndex: number, dropdownIndex: number) {
    switch (bankIndex) {
      case this.headersMap.customers:
        return '';
      case this.headersMap.invoiceDetails:
        return '';
      case this.headersMap.generatedInvoice:
        return '';
      case this.headersMap.reports:
        return this.swicthReportsLink(dropdownIndex);
      default:
        return '';
    }
  }
  private swicthReportsLink(index: number) {
    switch (index) {
      case this.reportsMap.overview:
        return '/vendor/reports/overview';
      case this.reportsMap.transactionDetails:
        return '/vendor/reports/transactions';
      case this.reportsMap.invoiceDetails:
        return '/vendor/reports/invoice';
      case this.reportsMap.customerDetailReport:
        return '/vendor/reports/customer';
      case this.reportsMap.userLogReport:
        return '/vendor/reports/userlog';
      case this.reportsMap.auditTrails:
        return '/vendor/reports/audit';
      default:
        return '';
    }
  }
  getHeaderDropdownArray(index: number) {
    return this.headers.at(index).get('dropdowns') as FormArray;
  }
  routerClicked(ahref: HTMLAnchorElement) {
    ahref.blur();
  }
  ahrefClicked(link: string) {
    console.log(link);
  }
  verifyCurrentRoute(path: string) {
    return location.pathname.includes(path);
  }
  get headers() {
    return this.formGroup.get('headers') as FormArray;
  }
}
