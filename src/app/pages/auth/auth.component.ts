import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageSelectorComponent } from 'src/app/components/language-selector/language-selector.component';
import { FooterComponent } from 'src/app/components/layouts/footer/footer.component';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    LanguageSelectorComponent,
    FooterComponent,
  ],
})
export class AuthComponent {}
