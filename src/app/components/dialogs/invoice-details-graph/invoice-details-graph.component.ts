import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as json from 'src/assets/temp/data.json';

@Component({
  selector: 'app-invoice-details-graph',
  templateUrl: './invoice-details-graph.component.html',
  styleUrls: ['./invoice-details-graph.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class InvoiceDetailsGraphComponent implements OnInit {
  private contentPlaceholder!: ElementRef;
  ngOnInit(): void {
    let data = JSON.parse(JSON.stringify(json));
  }
  @ViewChild('contentPlaceholder', { static: false }) set content(
    content: ElementRef
  ) {
    if (content) {
      this.contentPlaceholder = content;
    }
  }
}
