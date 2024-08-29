import { FormControl } from '@angular/forms';
import { AddEmailTextForm } from '../email-text/add-email-text-form';

//export class AddSmsTextForm extends AddEmailTextForm {}
export interface AddSmsTextForm {
  flow: FormControl<number | string | null | undefined>;
  text: FormControl<string | null | undefined>;
  loctext: FormControl<string | null | undefined>;
  sub: FormControl<string | null | undefined>;
  subloc: FormControl<string | null | undefined>;
  sno: FormControl<number | null | undefined>;
  userid: FormControl<number | null | undefined>;
}
