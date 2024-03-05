import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { GeneratedInvoiceViewComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-view/generated-invoice-view.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import * as json from 'src/assets/temp/data.json';
import { Dropdown, Ripple, Select, initTE } from 'tw-elements';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';

@Component({
  selector: 'app-generated-invoice-list',
  templateUrl: './generated-invoice-list.component.html',
  styleUrls: ['./generated-invoice-list.component.scss'],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/generated', alias: 'generated' },
    },
  ],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    RemoveItemDialogComponent,
    SuccessMessageBoxComponent,
    TableDateFiltersComponent,
  ],
})
export class GeneratedInvoiceListComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public generatedInvoices: GeneratedInvoice[] = [];
  public generatedInvoicesData: GeneratedInvoice[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public headersMap = {
    customerName: 0,
    invoiceNo: 1,
    invoiceDate: 2,
    paymentType: 3,
    totalAmount: 4,
    deliveryStatus: 5,
  };
  @ViewChild('generatedInvoiceTable') generatedInvoiceTable!: ElementRef;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private translocoService: TranslocoService,
    private fb: FormBuilder,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  //create formGroup for each header item in table
  private createHeadersForm() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
      .selectTranslate('generatedInvoicesTable', {}, this.scope)
      .subscribe((labels: string[]) => {
        if (labels && labels.length > 0) {
          labels.forEach((label, index) => {
            let header = this.fb.group({
              label: this.fb.control(label, []),
              search: this.fb.control('', []),
              sortAsc: this.fb.control('', []),
              values: this.fb.array([], []),
            });
            this.tableHeaderFilterValues(header, index);
            header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
              if (value === true) {
                this.sortTableAsc(index);
              } else {
                this.sortTableDesc(index);
              }
            });
            this.headers.push(header);
          });
        }
      });
  }
  //creates a name and an active state FormControl, filtering data when the active state changes
  private tableHeaderFilterValues(header: FormGroup, index: number) {
    let values: string[] = this.getTableColumnDataVariations(index);
    values.forEach((elem) => {
      let value = this.fb.group({
        name: this.fb.control(elem.trim(), []),
        isActive: this.fb.control(true, []),
      });
      value.get('isActive')?.valueChanges.subscribe((value: string | any) => {
        let filteringIndexes = [
          this.headersMap.deliveryStatus,
          this.headersMap.paymentType,
        ];
        this.generatedInvoices = this.filterTable(filteringIndexes);
      });
      (header.get('values') as FormArray).push(value);
    });
  }
  //finds the inActive values within the formArrays and filters their data
  private filterTable(indexes: number[]) {
    let [deliveryStatus, paymentType] = indexes;
    let deliveryStatusArr = this.headers
      ?.at(deliveryStatus)
      ?.get('values') as FormArray;
    let payments = this.headers?.at(paymentType)?.get('values') as FormArray;
    let deliveryStatusValues = deliveryStatusArr.controls
      .filter((v) => v.get('isActive')?.value)
      .map((f) => f.get('name')?.value.toLocaleLowerCase());
    let paymentValues = payments.controls
      .filter((p) => p.get('isActive')?.value)
      .map((f) => f.get('name')?.value.toLocaleLowerCase());
    if (!deliveryStatusValues || !paymentValues) {
      return [];
    }
    return this.generatedInvoicesData.filter((f) => {
      return (
        deliveryStatusValues.indexOf(
          f.delivery_status.trim().toLocaleLowerCase()
        ) !== -1 &&
        paymentValues.indexOf(f.Payment_Type.trim().toLocaleLowerCase()) !== -1
      );
    });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case this.headersMap.invoiceNo:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No > b.Invoice_No ? 1 : -1
        );
        break;
      case this.headersMap.invoiceDate:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_Date > b.Invoice_Date ? 1 : -1
        );
        break;
      case this.headersMap.customerName:
        this.generatedInvoices.sort((a, b) =>
          a.Chus_Name > b.Chus_Name ? 1 : -1
        );
        break;
      case this.headersMap.paymentType:
        this.generatedInvoices.sort((a, b) =>
          a.Payment_Type > b.Payment_Type ? 1 : -1
        );
        break;
      case this.headersMap.totalAmount:
        this.generatedInvoices.sort((a, b) => (a.Total > b.Total ? 1 : -1));
        break;
      case this.headersMap.deliveryStatus:
        this.generatedInvoices.sort((a, b) =>
          a.delivery_status > b.delivery_status ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case this.headersMap.invoiceNo:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No < b.Invoice_No ? 1 : -1
        );
        break;
      case this.headersMap.invoiceDate:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_Date < b.Invoice_Date ? 1 : -1
        );
        break;
      case this.headersMap.customerName:
        this.generatedInvoices.sort((a, b) =>
          a.Chus_Name < b.Chus_Name ? 1 : -1
        );
        break;
      case this.headersMap.paymentType:
        this.generatedInvoices.sort((a, b) =>
          a.Payment_Type < b.Payment_Type ? 1 : -1
        );
        break;
      case this.headersMap.totalAmount:
        this.generatedInvoices.sort((a, b) => (a.Total < b.Total ? 1 : -1));
        break;
      case this.headersMap.deliveryStatus:
        this.generatedInvoices.sort((a, b) =>
          a.delivery_status < b.delivery_status ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  //Given a column index, this function returns all unique values of the specified key in the arrays.
  private getTableColumnDataVariations(ind: number) {
    switch (ind) {
      case this.headersMap.deliveryStatus:
        let delivery_statusArr = new Set(
          this.generatedInvoicesData.map((elem) => elem.delivery_status)
        );
        return delivery_statusArr.size <= 10 ? [...delivery_statusArr] : [];
      case this.headersMap.paymentType:
        let paymentType = new Set(
          this.generatedInvoicesData.map((e) => e.Payment_Type)
        );
        return paymentType.size <= 10 ? [...paymentType] : [];
      default:
        return [];
    }
  }
  ngOnInit(): void {
    let data = JSON.parse(JSON.stringify(json));
    this.generatedInvoicesData = data.generatedInvoices;
    this.generatedInvoices = this.generatedInvoicesData;
    this.createHeadersForm();
  }
  ngAfterViewInit(): void {}
  getValueArray(ind: number) {
    return this.headers.controls.at(ind)?.get('values') as FormArray;
  }
  //action to sort table by column
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    if (!sortAsc?.value) {
      this.sortTableDesc(ind);
      sortAsc?.setValue(true);
    } else {
      this.sortTableAsc(ind);
      sortAsc?.setValue(false);
    }
  }
  //opens remove table row dialog
  openRemoveDialog(id: number, dialog: RemoveItemDialogComponent) {
    dialog.title = 'Confirm';
    dialog.message =
      'Are you sure you want to permanently delete this invoice?';
    dialog.openDialog();
    dialog.remove.asObservable().subscribe((e) => {
      this.generatedInvoices.splice(id, 1);
      this.successMessageBox.title = 'Invoice deleted successfully!';
      this.successMessageBox.openDialog();
    });
  }
  moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  convertDotNetJSONDate(dotNetJSONDate: string) {
    const timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp).toLocaleDateString();
  }
  //action to filter table by search key up
  searchTableKeyup(searchText: string) {
    if (searchText) {
      this.generatedInvoices = this.generatedInvoicesData.filter(
        (elem: GeneratedInvoice) => {
          return (
            elem.Chus_Name.toLocaleLowerCase().includes(
              searchText.toLocaleLowerCase()
            ) ||
            elem.delivery_status
              .toLocaleLowerCase()
              .includes(searchText.toLocaleLowerCase()) ||
            elem.Invoice_No.toLocaleLowerCase().includes(
              searchText.toLocaleLowerCase()
            )
          );
        }
      );
    } else {
      this.generatedInvoices = this.generatedInvoicesData;
    }
  }
  //opens generate chart dialog
  openGeneratedInvoiceChart() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        headersMap: this.headersMap,
        headers: this.headers.controls.map((c) => c.get('label')?.value),
        generatedInvoices: this.generatedInvoicesData,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  //opens invoice view
  openGeneratedInvoiceView(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(GeneratedInvoiceViewComponent, {
      width: '800px',
      height: '700px',
      data: {
        invoice: generatedInvoice,
        forDownload: false,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  //opens invoice details for editing
  openInvoiceDetailsView(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
      height: '700px',
      data: {
        generatedInvoice: generatedInvoice,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  //saves a copy of an invoice to the local machine
  downloadInvoice(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(GeneratedInvoiceViewComponent, {
      width: '800px',
      data: {
        invoice: generatedInvoice,
        forDownload: true,
      },
    });
    dialogRef.afterOpened().subscribe((e) => {
      let element = dialogRef.componentInstance.invoiceView
        .nativeElement as HTMLDivElement;

      this.fileHandler.downloadPdf(element, 'generated-invoice.pdf');
      dialogRef.close();
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  //returns a form control given a name
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  //showing items select changed
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
  //verifies if table is being filtered
  hasInactiveValue(ind: number) {
    let values = this.headers.at(ind).get('values') as FormArray;
    return values.controls.find((c) => !c.get('isActive')?.value)
      ? true
      : false;
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
}
