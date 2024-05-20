import { FormArray, FormBuilder } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';

export class TableUtilities {
  static createHeaders(
    tr: TranslocoService,
    translatePath: string,
    scope: any,
    headers: FormArray,
    fb: FormBuilder,
    tableComponent: any,
    nItems: number = 5
  ) {
    tr.selectTranslate(translatePath, {}, scope).subscribe(
      (labels: string[]) => {
        labels.forEach((label, index) => {
          let header = fb.group({
            label: fb.control(label, []),
            sortAsc: fb.control(false, []),
            included: fb.control(index < nItems, []),
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
}
