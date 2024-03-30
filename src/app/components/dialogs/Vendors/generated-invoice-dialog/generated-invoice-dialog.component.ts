import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import * as json from 'src/assets/temp/data.json';
import { Chart } from 'tw-elements';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-generated-invoice-dialog',
  templateUrl: './generated-invoice-dialog.component.html',
  styleUrls: ['./generated-invoice-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/generated', alias: 'generated' },
    },
  ],
})
export class GeneratedInvoiceDialogComponent implements OnInit {
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  public generatedInvoicesData: GeneratedInvoice[] = [];
  public chartTypes = ['BarChart', 'LineChart', 'PieChart '];
  public formGroup!: FormGroup;
  public invoices: any[][] = [];
  @ViewChild('graphContainer') graphContainer!: ElementRef;
  constructor(
    private translocoService: TranslocoService,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      headersMap: {
        customerName: number;
        invoiceNo: number;
        invoiceDate: number;
        paymentType: number;
        totalAmount: number;
        deliveryStatus: number;
      };
      headers: string[];
      generatedInvoices: GeneratedInvoice[];
    }
  ) {}
  private createFormGroup() {
    this.formGroup = this.fb.group({
      xAxis: this.fb.control('', [Validators.required]),
      yAxis: this.fb.control('', [Validators.required]),
      type: this.fb.control('', [Validators.required]),
      labels: this.fb.array([], []),
      dataset: this.fb.array([], []),
      startDate: this.fb.control(
        AppUtilities.dateToFormat(new Date(2020, 1, 1), 'yyyy-MM-dd'),
        []
      ),
      endDate: this.fb.control(
        AppUtilities.dateToFormat(new Date(2024, 2, 1), 'yyyy-MM-dd'),
        []
      ),
    });
    this.xAxis.valueChanges.subscribe((value) => {
      let index = this.data.headers.indexOf(value);
      if (index !== -1) {
        this.switchXAxisLabels(index);
      }
    });
    this.yAxis.valueChanges.subscribe((value) => {
      let index = this.data.headers.indexOf(value);
      if (index !== -1) {
        this.switchYAxisLabels(index);
      }
    });
  }
  private appendInvoiceDateXAxis() {
    let dates = this.data.generatedInvoices.map((g) => {
      return this.fb.control(
        AppUtilities.convertDotNetJsonDateToDate(g.Invoice_Date.toString()),
        []
      );
    });
    this.formGroup.setControl('labels', this.fb.array(dates));
  }
  private appendInvoicePaymentTypeXAxis() {
    let types = this.data.generatedInvoices.map((g) => {
      return this.fb.control(g.Payment_Type.trim(), []);
    });
    this.formGroup.setControl('labels', this.fb.array(types));
  }
  private appendInvoicePaymentTypeYAxis() {
    let types = this.data.generatedInvoices.map((g) => {
      return this.fb.control(g.Payment_Type.trim(), []);
    });
    this.formGroup.setControl('dataset', this.fb.array(types));
  }
  private appendTotalAmountYAxis() {
    let amounts = this.data.generatedInvoices.map((g) => {
      return this.fb.control(g.Total, []);
    });
    this.formGroup.setControl('dataset', this.fb.array(amounts));
  }
  private switchXAxisLabels(index: number) {
    switch (index) {
      case this.data.headersMap.customerName:
        break;
      case this.data.headersMap.invoiceNo:
        break;
      case this.data.headersMap.invoiceDate:
        this.appendInvoiceDateXAxis();
        break;
      case this.data.headersMap.paymentType:
        this.appendInvoicePaymentTypeXAxis();
        break;
      case this.data.headersMap.totalAmount:
        break;
      case this.data.headersMap.deliveryStatus:
        break;
      default:
        break;
    }
  }
  private switchYAxisLabels(index: number) {
    switch (index) {
      case this.data.headersMap.customerName:
        break;
      case this.data.headersMap.invoiceNo:
        break;
      case this.data.headersMap.invoiceDate:
        break;
      case this.data.headersMap.paymentType:
        this.appendInvoicePaymentTypeYAxis();
        break;
      case this.data.headersMap.totalAmount:
        this.appendTotalAmountYAxis();
        break;
      case this.data.headersMap.deliveryStatus:
        break;
      default:
        break;
    }
  }
  ngOnInit(): void {
    let data = JSON.parse(JSON.stringify(json));
    this.generatedInvoicesData = data.generatedInvoices;
    this.createFormGroup();
  }
  public updateGraphXAxis(index: number) {
    this.xAxis.setValue(this.data.headers.at(index));
  }
  public updateGraphYAxis(index: number) {
    this.yAxis.setValue(this.data.headers.at(index));
  }
  private graphData() {
    return {
      type: this.type.value,
      data: {
        labels: this.labels.controls.map((l) =>
          this.xAxis.value ===
          this.data.headers[this.data.headersMap.invoiceDate]
            ? l.value.toLocaleDateString()
            : l.value
        ),
        datasets: [
          {
            label: this.yAxis.value,
            type: this.type.value,
            data: this.dataset.controls.map((m) => m.value),
            order: 1,
          },
        ],
      },
    };
  }
  private graphCanvas(graphContainer: HTMLDivElement) {
    let data = this.graphData();
    let canvas = graphContainer.querySelector('canvas');
    if (canvas) {
      canvas?.remove();
    }
    let created = document.createElement('canvas');
    graphContainer.appendChild(created);
    new Chart(graphContainer.querySelector('canvas'), data, {});
  }
  private createGraphHtml() {
    if (this.isHiddenGraph()) {
      this.toggleGraphContainer();
    }
    this.graphCanvas(this.graphContainer.nativeElement as HTMLDivElement);
  }
  private isHiddenGraph() {
    let graphContainer = this.graphContainer.nativeElement as HTMLDivElement;
    return graphContainer.classList.contains('hidden');
  }
  private toggleGraphContainer() {
    let graphContainer = this.graphContainer.nativeElement as HTMLDivElement;
    if (graphContainer.classList.contains('hidden')) {
      graphContainer.classList.remove('hidden');
      graphContainer.classList.add('flex');
    } else {
      graphContainer.classList.remove('flex');
      graphContainer.classList.add('hidden');
    }
  }
  private validateGraphInputs(
    errorPath: string = 'generated.generateChart.form.dialog'
  ) {
    if (this.type.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorPath}.specifyGraphType`),
        this.translocoService.translate(`${errorPath}.specifyGraphTypeMsg`)
      );
      return false;
    }
    if (this.xAxis.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorPath}.missingAxis`),
        this.translocoService.translate(`${errorPath}.noXAxisFound`)
      );
      return false;
    }
    if (this.yAxis.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorPath}.missingAxis`),
        this.translocoService.translate(`${errorPath}.noYAxisFound`)
      );
      return false;
    }
    return true;
  }
  public generateGraph() {
    if (this.validateGraphInputs()) {
      this.createGraphHtml();
    }
  }
  public moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  convertDotNetJSONDate(dotNetJSONDate: string) {
    const timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp).toLocaleDateString();
  }
  graphTypeChanged(value: any) {
    switch (value) {
      case 'LineChart':
        this.type.setValue('line');
        break;
      case 'BarChart':
        this.type.setValue('bar');
        break;
      case 'PieChart':
        this.type.setValue('pie');
        break;
      default:
        break;
    }
  }
  get xAxis() {
    return this.formGroup.get('xAxis') as FormControl;
  }
  get yAxis() {
    return this.formGroup.get('yAxis') as FormControl;
  }
  get type() {
    return this.formGroup.get('type') as FormControl;
  }
  get labels() {
    return this.formGroup.get('labels') as FormArray;
  }
  get dataset() {
    return this.formGroup.get('dataset') as FormArray;
  }
  get startDate() {
    return this.formGroup.get('startDate') as FormControl;
  }
  get endDate() {
    return this.formGroup.get('endDate') as FormControl;
  }
}
