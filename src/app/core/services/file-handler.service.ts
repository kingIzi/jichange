import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import domtoimage from 'dom-to-image';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Injectable({
  providedIn: 'root',
})
export class FileHandlerService {
  constructor() {}

  //downloads a pdf to the user's desktop
  // public downloadPdf(element: HTMLElement, filename: string) {
  //   let doc = new jsPDF(
  //     element.clientWidth > element.clientHeight ? 'l' : 'p',
  //     'mm',
  //     [element.clientWidth, element.clientHeight]
  //   );
  //   return doc.html(element, {
  //     filename: filename,
  //     callback: (pdf: jsPDF) => {
  //       pdf.deletePage(pdf.getNumberOfPages());
  //       pdf.save();
  //     },
  //   });
  // }

  public downloadPdf(element: HTMLElement, filename: string) {
    let doc = new jsPDF(
      element.clientWidth > element.clientHeight ? 'l' : 'p',
      'mm',
      [element.clientWidth, element.clientHeight]
    );
    return doc.html(element, {
      callback: function (pdf: jsPDF) {
        pdf.deletePage(pdf.getNumberOfPages());
        pdf.save(filename);
      },
    });
  }
}
