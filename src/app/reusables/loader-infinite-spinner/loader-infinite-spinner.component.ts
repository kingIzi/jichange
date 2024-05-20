import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader-infinite-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader-infinite-spinner.component.html',
  styleUrl: './loader-infinite-spinner.component.scss',
})
export class LoaderInfiniteSpinnerComponent {
  @Input() show: boolean = false;
}
