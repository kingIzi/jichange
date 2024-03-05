import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss'],
  standalone: true,
  imports: [RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CompanyComponent {}
