import { AbstractControl, FormArray, FormControl } from '@angular/forms';

export class PerformanceUtils {
  static trackByIndex(index: number): number {
    return index;
  }
  static sortColumnClicked(ind: number, headers: FormArray) {
    let sortAsc = headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  static getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  static getIndexOfItem(items: any[], item: any) {
    let index = items.indexOf(item);
    return index + 1;
  }
  static getActiveStatusStyles(
    status: string,
    target: string,
    // includedBg: string = 'bg-green-100',
    // includedText: string = 'text-green-600',
    // excludedBg: string = 'bg-orange-100',
    // excludedText: string = 'text-orange-600'
    includedBg: string,
    includedText: string,
    excludedBg: string,
    excludedText: string
  ) {
    return status?.toLocaleLowerCase() === target?.toLocaleLowerCase()
      ? `${includedBg} ${includedText} px-4 py-1 rounded-lg shadow`
      : `${excludedBg} ${excludedText} px-4 py-1 rounded-lg shadow`;
  }
  static convertDateStringToDate(date: string) {
    return new Date(date);
  }
  static moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  static convertDotNetJSONDate(dotNetJSONDate: string) {
    let timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp);
  }
}

// export class DateUtils {
//   static convertDotNetJSONDate(dotNetJSONDate: string) {
//     let timestamp = parseInt(
//       dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
//       10
//     );
//     return new Date(timestamp);
//   }
//   static dateFormat(date: string) {
//     return new Date(date);
//   }
// }

// export class MoneyUtils {
//   static moneyFormat(value: string) {
//     return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//   }
// }
