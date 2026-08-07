import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CallApiService } from '../../../core/services/call-api.service';
import { TwoFactorSettingsComponent } from '../two-factor-settings/two-factor-settings.component';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    InputTextModule,
    ButtonModule,
    FloatLabelModule,
    ToastModule,
    TwoFactorSettingsComponent
  ],
  providers: [MessageService],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss'
})
export class ProfileSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(CallApiService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);

  loaded = false;
  email = '';
  twoFactorEnabled = false;
  twoFactorMethod: string | null = null;

  form = this.fb.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    phone: ['']
  });

  get initials(): string {
    const first = this.form.value.firstname?.charAt(0) || '';
    const last = this.form.value.lastname?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.call<Record<string, any>>({ type: 'GET', api: '/api/admin/profile' }).subscribe((data) => {
      this.form.patchValue({
        firstname: data['firstname'],
        lastname: data['lastname'],
        phone: data['phone']
      });
      this.email = data['email'];
      this.twoFactorEnabled = !!data['two_factor_enabled'];
      this.twoFactorMethod = data['two_factor_method'];
      this.loaded = true;
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.api.call({ type: 'PUT', api: '/api/admin/profile' }, this.form.getRawValue()).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.translate.instant('general.saved') });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: this.translate.instant('general.saveError') })
    });
  }
}
