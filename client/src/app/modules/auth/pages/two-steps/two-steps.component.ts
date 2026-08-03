import { Component, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-two-steps',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, AppButtonComponent],
  templateUrl: './two-steps.component.html',
  styleUrl: './two-steps.component.scss'
})
export class TwoStepsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  @ViewChildren('digit') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private challengeToken = this.route.snapshot.paramMap.get('token') || '';
  method = this.route.snapshot.queryParamMap.get('method') || 'totp';

  digits: string[] = ['', '', '', '', '', ''];
  loading = false;
  error: string | null = null;

  onDigitInput(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(-1);
    this.digits[index] = value;
    if (value && index < 5) {
      this.digitInputs.get(index + 1)?.nativeElement.focus();
    }
    if (this.digits.every((d) => d)) {
      this.submit();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      this.digitInputs.get(index - 1)?.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '';
    if (!text) return;
    event.preventDefault();
    text.split('').forEach((char, i) => (this.digits[i] = char));
    this.digitInputs.get(Math.min(text.length, 5))?.nativeElement.focus();
    if (this.digits.every((d) => d)) {
      this.submit();
    }
  }

  submit(): void {
    const code = this.digits.join('');
    if (code.length !== 6) return;

    this.error = null;
    this.loading = true;
    this.auth.verify2fa(this.challengeToken, code).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.token) {
          this.auth.storeSession(res.token, true);
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'auth.twoSteps.genericError';
        this.digits = ['', '', '', '', '', ''];
        this.digitInputs.get(0)?.nativeElement.focus();
      }
    });
  }
}
