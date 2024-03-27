import { TranslocoService } from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../components/dialogs/success-message-box/success-message-box.component';
import { FormControl } from '@angular/forms';
import { SubmitMessageBoxComponent } from '../components/dialogs/submit-message-box/submit-message-box.component';
import { formatDate } from '@angular/common';

export class AppUtilities {
  static openDisplayMessageBox(
    dialog: DisplayMessageBoxComponent,
    title: string,
    message: string
  ) {
    dialog.title = title;
    dialog.message = message;
    return dialog.openDialog();
  }

  static openDialog(dialog: any, title: string, message: string) {
    dialog.title = title;
    dialog.message = message;
    return dialog.openDialog();
  }

  static openSubmitMessageBox(
    dialog: SubmitMessageBoxComponent,
    title: string,
    message: string
  ) {
    dialog.title = title;
    dialog.message = message;
    return dialog.openDialog();
  }

  static openSuccessMessageBox(
    dialog: SuccessMessageBoxComponent,
    title: string
  ) {
    dialog.title = title;
    return dialog.openDialog();
  }

  static noInternetError(
    dialog: DisplayMessageBoxComponent,
    transloco: TranslocoService
  ) {
    AppUtilities.openDisplayMessageBox(
      dialog,
      transloco.translate(`errors.errorOccured`),
      transloco.translate(`errors.verifyConnection`)
    );
  }

  static unexpectedErrorOccured(
    dialog: DisplayMessageBoxComponent,
    transloco: TranslocoService
  ) {
    AppUtilities.openDisplayMessageBox(
      dialog,
      transloco.translate(`errors.errorOccured`),
      transloco.translate(`errors.contactSupport`)
    );
  }

  static updatePhoneNumberPrefix(control: FormControl, prefix: string) {
    prefix = prefix.substring(1);
    if (control.value.startsWith('0')) {
      let value = control.value.substring(1);
      control.setValue(prefix + value);
    } else if (
      !control.value.startsWith('0') &&
      !control.value.startsWith('255') &&
      control.value.length === 9
    ) {
      control.setValue(prefix + control.value);
    }
  }

  static mobileNumberFormat(prefix: string, control: FormControl) {
    let PHONE_LENGTH = 9;
    if (
      control.value.startsWith('0') &&
      control.value.length === PHONE_LENGTH + 1
    ) {
      let value = control.value.substring(1);
      control.setValue(prefix.substring(1) + value);
    } else if (
      control.value.startsWith(prefix) &&
      control.value.length === PHONE_LENGTH + prefix.length
    ) {
      control.setValue(control.value.substring(1));
    } else if (
      !control.value.startsWith('0') &&
      !control.value.startsWith(prefix) &&
      control.value.length === PHONE_LENGTH
    ) {
      control.setValue(prefix.substring(1) + control.value);
    }
  }

  static moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  static convertDotNetJsonDateToDate(dotNetJSONDate: string) {
    let timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp);
  }

  static convertDateToYearMonthDay(parts: string[]) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  static dateToFormat(date: Date, format: string) {
    return formatDate(date, format, 'en');
  }

  static translatedDate(
    date: Date = new Date(),
    months: { name: string; abbreviation: string }[]
  ) {
    return (
      date.getDate() +
      ' ' +
      months[date.getMonth()].abbreviation +
      ' ' +
      date.getFullYear()
    );
  }
}
