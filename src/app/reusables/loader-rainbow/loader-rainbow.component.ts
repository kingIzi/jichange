import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { toggle } from 'src/app/pages/auth/auth-animations';

@Component({
  selector: 'app-loader-rainbow',
  templateUrl: './loader-rainbow.component.html',
  styleUrls: ['./loader-rainbow.component.scss'],
  standalone: true,
  imports: [CommonModule],
  animations: [toggle],
})
export class LoaderRainbowComponent {
  @Input() public show: boolean = false;
}
