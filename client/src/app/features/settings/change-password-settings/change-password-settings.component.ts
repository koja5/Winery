import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CallApiService } from '../../../core/services/call-api.service';

@Component({
  selector: 'app-change-password-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    InputTextModule,
    ButtonModule,
    FloatLabelModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './change-password-settings.component.html',
  styleUrl: './change-password-settings.component.scss'
})
export class ChangePasswordSettingsComponent {
  private fb = inject(FormBuilder);
  private api = inject(CallApiService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('accountSettings.changePassword.mismatch')
      });
      return;
    }

    this.api
      .call({ type: 'POST', api: '/api/admin/profile/change-password' }, { currentPassword, newPassword })
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('accountSettings.changePassword.success')
          });
          this.form.reset();
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: this.translate.instant('accountSettings.changePassword.error')
          })
      });
  }
}
