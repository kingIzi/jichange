import { FormArray, FormBuilder } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { TableColumnsData } from '../core/models/table-columns-data';
import jsPDF from 'jspdf';

export class TableUtilities {
  // static createTableColumns(tr: TranslocoService,
  //   translatePath: string,
  //   scope: any,
  //   headers: FormArray,
  //   fb: FormBuilder,
  //   nItems: number = 5,
  //   hideFirstColumn: boolean = false) {
  //     tr.selectTranslate(translatePath, {}, scope).subscribe((labels:string[]) => {
  //       labels.forEach((label,index) => {
  //         let col = fb.group({
  //           included: fb.control(hideFirstColumn && index == 0 ? false : index < nItems, []),
  //           label: fb.control(label, []),
  //         });
  //         if (col.get(`included`)?.value === true) {
  //           this.tableColumns.push(label);
  //         }
  //       })
  //     });
  // }
  // static createTableColumns(tr: TranslocoService,path:string,scope:any,originalTableColumns:TableColumnsData[],fb: FormBuilder,showing:number) {
  //   tr
  //     .selectTranslate(path, {}, scope)
  //     .subscribe((labels: TableColumnsData[]) => {
  //       originalTableColumns = labels;
  //       originalTableColumns.forEach((column, index) => {
  //         let col = fb.group({
  //           included: fb.control(
  //             index === 0
  //               ? false
  //               : index < showing || index === labels.length - 1,
  //             []
  //           ),
  //           label: fb.control(column.label, []),
  //           value: fb.control(column.value, []),
  //         });
  //         col.get(`included`)?.valueChanges.subscribe((included) => {
  //           this.resetTableColumns();
  //         });
  //         if (index === labels.length - 1) {
  //           col.disable();
  //         }
  //         this.headers.push(col);
  //       });
  //       this.resetTableColumns();
  //     });
  // }
  static createHeaders(
    tr: TranslocoService,
    translatePath: string,
    scope: any,
    headers: FormArray,
    fb: FormBuilder,
    tableComponent: any,
    nItems: number = 5,
    hideFirstColumn: boolean = false
  ) {
    tr.selectTranslate(translatePath, {}, scope).subscribe(
      (labels: string[]) => {
        labels.forEach((label, index) => {
          let header = fb.group({
            label: fb.control(label, []),
            sortAsc: fb.control(false, []),
            included: fb.control(
              hideFirstColumn && index == 0 ? false : index < nItems,
              []
            ),
            values: fb.array([], []),
          });
          header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
            if (value === true) {
              tableComponent.sortTableAsc(index);
            } else {
              tableComponent.sortTableDesc(index);
            }
          });
          headers.push(header);
        });
      }
    );
  }

  private static calculatePdfTextWidth(text: string, doc: jsPDF) {
    let width =
      (doc.getStringUnitWidth(text) * doc.getFontSize()) /
      doc.internal.scaleFactor;
    return width;
  }

  static writePdfTitleText(doc: jsPDF, title: string) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    let pageWidth = doc.internal.pageSize.getWidth();
    let titleTextWidth = this.calculatePdfTextWidth(title, doc);
    let xPosition = (pageWidth - titleTextWidth) / 2;
    let titlePositionY = 10;
    doc.setFont('helvetica', 'bold');
    doc.text(title, xPosition, titlePositionY);
    return titlePositionY;
  }

  static writePdfTextAlignedLeft(
    doc: jsPDF,
    label: string,
    value: string,
    positionY: number
  ) {
    let margins = 14;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let branchTextWidth = this.calculatePdfTextWidth(value, doc);
    let branchTextXPosition = margins; //branchTextWidth;
    doc.text(label, branchTextXPosition, positionY, { align: 'left' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(value, branchTextXPosition, positionY * 1.15, { align: 'left' });

    return [positionY, positionY * 1.15];
  }

  static writePdfTextAlignedRight(
    doc: jsPDF,
    label: string,
    value: string,
    positionY: number
  ) {
    let margins = 14;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let valueTextWidth = this.calculatePdfTextWidth(value, doc);
    let valueTextXPosition = doc.internal.pageSize.getWidth() - margins;
    doc.text(label, valueTextXPosition, positionY, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(value, valueTextXPosition, positionY * 1.15, { align: 'right' });
    return [positionY, positionY * 1.15];
  }

  static writePdfTextAlignedCenter(
    doc: jsPDF,
    label: string,
    value: string,
    positionY: number
  ) {
    let margins = 14;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let valueTextWidth = this.calculatePdfTextWidth(value, doc);
    let valueTextXPosition = (doc.internal.pageSize.getWidth() - margins) / 2;
    doc.text(label, valueTextXPosition, positionY, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(value, valueTextXPosition, positionY * 1.15, { align: 'center' });
    return [positionY, positionY * 1.15];
  }

  static pdfData(array: any[], headers: FormArray, dateKeys: string[]) {
    let body = array.map((row) => {
      return headers.controls
        .filter(
          (h) => h.get('included')?.value && h.get('value')?.value !== 'Action'
        )
        .map((h) => {
          let key = h.get('value')?.value;
          let cellValue = row[key];

          // Check if the cellValue is a Date and format it accordingly
          // if (key === 'Payment_Date' && cellValue instanceof Date) {
          //   return formatDate(cellValue); // Format the date as needed
          // }
          let found = dateKeys.includes(key)
            ? new Date(cellValue).toDateString()
            : cellValue;

          return found; // Return the value as is for non-date fields
        });
    });
    return body;
  }
}
