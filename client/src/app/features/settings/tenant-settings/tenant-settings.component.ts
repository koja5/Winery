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

@Component({
  selector: 'app-tenant-settings',
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
  templateUrl: './tenant-settings.component.html',
  styleUrl: './tenant-settings.component.scss'
})
export class TenantSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(CallApiService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);

  loaded = false;

  form = this.fb.group({
    name: ['', Validators.required],
    pib: [''],
    mb: [''],
    email: [''],
    phone: [''],
    address: [''],
    zip: [''],
    city: [''],
    responsible_person: [''],
    bank_account: ['']
  });

  get initial(): string {
    return (this.form.value.name?.charAt(0) || '?').toUpperCase();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.call<Record<string, any>>({ type: 'GET', api: '/api/admin/tenant' }).subscribe((data) => {
      this.form.patchValue(data);
      this.loaded = true;
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.api.call({ type: 'PUT', api: '/api/admin/tenant' }, this.form.getRawValue()).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.translate.instant('general.saved') });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: this.translate.instant('general.saveError') })
    });
  }
}
