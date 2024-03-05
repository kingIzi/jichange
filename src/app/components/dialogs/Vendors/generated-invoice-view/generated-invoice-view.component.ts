import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { CommonModule, DatePipe } from '@angular/common';
import * as json from 'src/assets/temp/data.json';
import { CancelledDialogComponent } from '../../cancelled-dialog/cancelled-dialog.component';

@Component({
  selector: 'app-generated-invoice-view',
  templateUrl: './generated-invoice-view.component.html',
  styleUrls: ['./generated-invoice-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    CancelledDialogComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/generated', alias: 'generated' },
    },
  ],
})
export class GeneratedInvoiceViewComponent implements OnInit, AfterViewInit {
  public itemsData: any[] = [];
  public formGroup!: FormGroup;
  @ViewChild('invoiceView') invoiceView!: ElementRef;
  @ViewChild('cancelledCanvas') cancelledCanvas!: ElementRef;
  @ViewChild('cancelledImage') cancelledImage!: ElementRef;
  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private dialogRef: MatDialogRef<GeneratedInvoiceViewComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { invoice: GeneratedInvoice; forDownload: boolean }
  ) {}
  private createForm() {
    this.formGroup = this.fb.group({
      invoiceNo: this.fb.control(this.data.invoice.Invoice_No.trim(), [
        Validators.required,
      ]),
      controlNo: this.fb.control(120400000, [Validators.required]),
      dateIssued: this.fb.control(
        AppUtilities.convertDotNetJsonDateToDate(
          this.data.invoice.Invoice_Date.toString()
        ),
        []
      ),
      paymentType: this.fb.control(this.data.invoice.Payment_Type, []),
      issuedTo: this.fb.group({
        fullName: this.fb.control(this.data.invoice.Chus_Name.trim()),
        address: this.fb.control('1234 Ali Hassan Mwinyi Road', []),
        city: this.fb.control('Dar es Salaam, Tanzania', []),
        phone: this.fb.control('255724636906', []),
      }),
      issuedBy: this.fb.group({
        fullName: this.fb.control(this.data.invoice.Cmpny_Name.trim()),
        address: this.fb.control('27 Samora Avenue Ilala district', []),
        city: this.fb.control('Dar es Salaam, Tanzania', []),
        phone: this.fb.control('255753565432', []),
      }),
      discount: this.fb.control('40%', []),
      items: this.fb.array([], []),
      remark: this.fb.control(this.data.invoice.Remarks.trim(), []),
      bankName: this.fb.control('CRDB Bank PLC', []),
      accountNo: this.fb.control('123-456-7890'),
    });
  }
  private appendItems() {
    this.itemsData.forEach((item) => {
      let group = this.fb.group({
        description: this.fb.control(item.description.trim(), []),
        quantity: this.fb.control(item.quantity, []),
        price: this.fb.control(item.price, []),
      });
      this.items.push(group);
    });
  }
  private decreasetAmountByDiscount(sum: number, percentage: number) {
    let decimalPercentage = percentage / 100;
    let decreaseAmount = sum * decimalPercentage;
    let decreasedSum = sum - decreaseAmount;
    return decreasedSum;
  }
  ngOnInit(): void {
    let data = JSON.parse(JSON.stringify(json));
    this.itemsData = data.items;
    this.createForm();
    this.appendItems();
  }
  ngAfterViewInit(): void {
    if (this.data.invoice.approval_status === '0') {
      let canvas = this.cancelledCanvas.nativeElement as HTMLCanvasElement;
      //this.drawCancelledWatermark(canvas);
    }
  }
  private drawCancelledWatermark(canvas: HTMLCanvasElement) {
    let view = this.invoiceView.nativeElement as HTMLFormElement;
    canvas.width = view.clientWidth;
    canvas.height = view.clientHeight;
    let ctx = canvas.getContext('2d');
    if (ctx) {
      // ctx.fillStyle = '#FF0E0E';
      ctx.strokeStyle = '#FF0E0E';
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let text = 'Cancelled';
      var fontSize = canvas.width / text.length;
      ctx.font = fontSize * 2 + 'px Helvetica';
      ctx.strokeText('Cancelled', 0, canvas.height / 2);
      var imgData = canvas.toDataURL('image/png', 1.0);
    }
  }
  formatDate(date: Date, format: string) {
    return AppUtilities.dateToFormat(date, format);
  }
  dateFormat(date: string) {
    return AppUtilities.convertDotNetJsonDateToDate(date).toDateString();
  }
  accumulateTotal() {
    let sum = this.items.controls.reduce(
      (total, item) =>
        total + item.get('price')?.value * item.get('quantity')?.value,
      0
    );
    let discount = this.discount.value.substring(
      0,
      this.discount.value.length - 1
    );
    let estimate = this.decreasetAmountByDiscount(sum, Number(discount));
    return this.moneyFormat(estimate.toString());
  }
  moneyFormat(amount: string) {
    return AppUtilities.moneyFormat(amount);
  }
  get invoiceNo() {
    return this.formGroup.get('invoiceNo') as FormControl;
  }
  get controlNo() {
    return this.formGroup.get('controlNo') as FormControl;
  }
  get dateIssued() {
    return this.formGroup.get('dateIssued') as FormControl;
  }
  get paymentType() {
    return this.formGroup.get('paymentType') as FormControl;
  }
  get issuedTo() {
    return this.formGroup.get('issuedTo') as FormGroup;
  }
  get issuedBy() {
    return this.formGroup.get('issuedBy') as FormGroup;
  }
  get discount() {
    return this.formGroup.get('discount') as FormControl;
  }
  get items() {
    return this.formGroup.get('items') as FormArray;
  }
  get remark() {
    return this.formGroup.get('remark') as FormControl;
  }
  get bankName() {
    return this.formGroup.get('bankName') as FormControl;
  }
  get accountNo() {
    return this.formGroup.get('accountNo') as FormControl;
  }
}
