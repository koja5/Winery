import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CallApiService } from '../../../core/services/call-api.service';

@Component({
  selector: 'app-two-factor-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './two-factor-settings.component.html'
})
export class TwoFactorSettingsComponent implements OnInit {
  @Input() enabled = false;
  @Input() method: string | null = null;

  private api = inject(CallApiService);
  private translate = inject(TranslateService);
  private confirmation = inject(ConfirmationService);
  private messages = inject(MessageService);

  processing = false;

  setupVisible = false;
  step: 1 | 2 = 1;
  qr = '';
  secret = '';
  code = '';
  codeError = false;

  ngOnInit(): void {}

  enableEmail(): void {
    if (this.processing) return;
    this.processing = true;
    this.api.call<{ enabled: boolean; method: string }>({ type: 'POST', api: '/api/auth/2fa/enable-email' }).subscribe({
      next: (data) => {
        this.processing = false;
        this.enabled = data.enabled;
        this.method = data.method;
        this.messages.add({ severity: 'success', summary: this.translate.instant('accountSettings.twoFactor.enabledToast') });
      },
      error: () => {
        this.processing = false;
        this.messages.add({ severity: 'error', summary: this.translate.instant('accountSettings.twoFactor.genericError') });
      }
    });
  }

  openTotpSetup(): void {
    this.setupVisible = true;
    this.step = 1;
    this.qr = '';
    this.secret = '';
    this.code = '';
    this.codeError = false;
    this.processing = true;

    this.api
      .call<{ secret: string; qrCodeDataUrl: string }>({ type: 'POST', api: '/api/auth/2fa/setup-totp' })
      .subscribe({
        next: (data) => {
          this.processing = false;
          this.qr = data.qrCodeDataUrl;
          this.secret = data.secret;
          this.step = 2;
        },
        error: () => {
          this.processing = false;
          this.setupVisible = false;
          this.messages.add({ severity: 'error', summary: this.translate.instant('accountSettings.twoFactor.genericError') });
        }
      });
  }

  confirmTotp(): void {
    const code = this.code.trim();
    if (code.length !== 6 || this.processing) {
      this.codeError = true;
      return;
    }
    this.processing = true;
    this.codeError = false;

    this.api
      .call<{ enabled: boolean; method: string }>({ type: 'POST', api: '/api/auth/2fa/enable-totp' }, { code })
      .subscribe({
        next: (data) => {
          this.processing = false;
          this.setupVisible = false;
          this.enabled = data.enabled;
          this.method = data.method;
          this.messages.add({ severity: 'success', summary: this.translate.instant('accountSettings.twoFactor.enabledToast') });
        },
        error: () => {
          this.processing = false;
          this.codeError = true;
        }
      });
  }

  confirmDisable(): void {
    this.confirmation.confirm({
      header: this.translate.instant('accountSettings.twoFactor.confirmDisableTitle'),
      message: this.translate.instant('accountSettings.twoFactor.confirmDisableMessage'),
      acceptLabel: this.translate.instant('accountSettings.twoFactor.disableButton'),
      rejectLabel: this.translate.instant('accountSettings.twoFactor.cancel'),
      accept: () => this.disable()
    });
  }

  private disable(): void {
    if (this.processing) return;
    this.processing = true;
    this.api.call<{ enabled: boolean }>({ type: 'POST', api: '/api/auth/2fa/disable' }).subscribe({
      next: (data) => {
        this.processing = false;
        this.enabled = data.enabled;
        this.method = null;
        this.messages.add({ severity: 'success', summary: this.translate.instant('accountSettings.twoFactor.disabledToast') });
      },
      error: () => {
        this.processing = false;
        this.messages.add({ severity: 'error', summary: this.translate.instant('accountSettings.twoFactor.genericError') });
      }
    });
  }
}
