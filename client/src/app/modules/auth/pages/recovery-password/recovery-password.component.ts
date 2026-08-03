import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-recovery-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, AppButtonComponent],
  templateUrl: './recovery-password.component.html',
  styleUrl: './recovery-password.component.scss'
})
export class RecoveryPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  private token = this.route.snapshot.paramMap.get('id') || '';

  loading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: [passwordsMatchValidator] }
  );

  get isSuccess(): boolean {
    return this.message?.type === 'success';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.message = null;
    this.loading = true;

    this.auth.resetPassword(this.token, this.form.getRawValue().password!).subscribe({
      next: () => {
        this.loading = false;
        this.message = { type: 'success', text: 'auth.recoveryPassword.successMessage' };
      },
      error: (err) => {
        this.loading = false;
        this.message = { type: 'error', text: err?.error?.message || 'auth.recoveryPassword.genericError' };
      }
    });
  }
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
}
