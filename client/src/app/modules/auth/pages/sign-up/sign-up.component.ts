import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, AppButtonComponent],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;

  form = this.fb.group(
    {
      tenantName: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: [passwordsMatchValidator] }
  );

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.message = null;
    this.loading = true;
    const { tenantName, firstname, lastname, email, password } = this.form.getRawValue();

    this.auth.register({ tenantName: tenantName!, firstname: firstname!, lastname: lastname!, email: email!, password: password! }).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = { type: 'success', text: 'auth.signUp.successfullyCreateAccount' };
        if (res.token) {
          this.auth.storeSession(res.token, true);
          setTimeout(() => this.router.navigate(['/']), 900);
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = { type: 'error', text: err?.error?.message || 'auth.signUp.genericError' };
      }
    });
  }
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
}
