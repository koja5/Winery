import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, AppButtonComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.message = null;
    this.loading = true;

    this.auth.forgotPassword(this.form.getRawValue().email!).subscribe({
      next: () => {
        this.loading = false;
        this.message = { type: 'success', text: 'auth.forgotPassword.successMessage' };
      },
      error: () => {
        this.loading = false;
        this.message = { type: 'error', text: 'auth.forgotPassword.genericError' };
      }
    });
  }
}
