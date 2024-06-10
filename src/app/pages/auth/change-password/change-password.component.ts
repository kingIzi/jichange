import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslocoModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
})
export class ChangePasswordComponent implements OnInit {
  public formGroup!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute
  ) {}
  private createFormGroup() {
    this.formGroup = this.fb.group({
      mob: this.fb.control('', [Validators.required]),
      password: this.fb.control('', [Validators.required]),
      changePassword: this.fb.control('', [Validators.required]),
    });
    this.mob.disable();
  }
  ngOnInit(): void {
    this.createFormGroup();
  }
  get mob() {
    return this.formGroup.get('mob') as FormControl;
  }
  get password() {
    return this.formGroup.get('password') as FormControl;
  }
  get changePassword() {
    return this.formGroup.get('changePassword') as FormControl;
  }
}
