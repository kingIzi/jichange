import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild('noInternetModal') noInternetModal!: ElementRef;
  @ViewChild('connectedModal') connectedModal!: ElementRef;
  ngOnInit(): void {
    // throw new Error('Method not implemented.');
    window.addEventListener('online', () => {
      (this.connectedModal.nativeElement as HTMLDialogElement).showModal();
    });
    window.addEventListener('offline', () => {
      (this.noInternetModal.nativeElement as HTMLDialogElement).showModal();
      //alert('is offline');
    });
  }
  title = 'jichange';
}
