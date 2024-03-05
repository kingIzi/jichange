import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-invoice-generated',
  templateUrl: './invoice-generated.component.html',
  styleUrls: ['./invoice-generated.component.scss'],
  standalone: true,
  imports: [RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InvoiceGeneratedComponent {}
