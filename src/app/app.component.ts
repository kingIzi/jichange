import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { HeaderComponent } from './components/layouts/header/header.component';
import { FooterComponent } from './components/layouts/footer/footer.component';
import { CommonModule } from '@angular/common';
import { VendorHeaderComponent } from './components/layouts/vendor-header/vendor-header.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    TranslocoModule,
    HeaderComponent,
    FooterComponent,
    CommonModule,
    VendorHeaderComponent,
  ],
})
export class AppComponent implements OnInit {
  @ViewChild('noInternetModal') noInternetModal!: ElementRef;
  @ViewChild('connectedModal') connectedModal!: ElementRef;
  constructor() {}
  private verifyInternet() {
    window.addEventListener('online', () => {
      (this.connectedModal.nativeElement as HTMLDialogElement).showModal();
    });
    window.addEventListener('offline', () => {
      (this.noInternetModal.nativeElement as HTMLDialogElement).showModal();
    });
  }
  ngOnInit(): void {
    this.verifyInternet();
  }
}
