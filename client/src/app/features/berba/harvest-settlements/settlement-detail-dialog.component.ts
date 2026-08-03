import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AppButtonComponent } from '../../../shared/components/button/button.component';
import { HarvestSettlementsService, SettlementDetail } from './harvest-settlements.service';
import { toLocalDateInputValue } from '../../../core/utils/date.util';

@Component({
  selector: 'app-settlement-detail-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, TranslateModule, ToastModule, AppButtonComponent],
  providers: [MessageService],
  templateUrl: './settlement-detail-dialog.component.html',
  styleUrl: './settlement-detail-dialog.component.scss'
})
export class SettlementDetailDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() settlementId: string | null = null;
  @Output() changed = new EventEmitter<void>();

  private settlementsService = inject(HarvestSettlementsService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);

  loading = false;
  detail: SettlementDetail | null = null;
  submittingPayment = false;

  paymentDate = toLocalDateInputValue(new Date());
  amount: number | null = null;
  method = '';
  notes = '';

  ngOnChanges(): void {
    if (this.visible && this.settlementId) {
      this.load();
    }
  }

  get balanceDue(): number {
    if (!this.detail) return 0;
    const paid = this.detail.payments.reduce((sum, p) => sum + Number(p['amount']), 0);
    return Math.round((Number(this.detail.settlement['total_amount']) - paid) * 100) / 100;
  }

  private load(): void {
    this.loading = true;
    this.detail = null;
    this.settlementsService.getDetail(this.settlementId!).subscribe({
      next: (detail) => {
        this.detail = detail;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  submitPayment(): void {
    if (!this.amount || this.amount <= 0) {
      this.messages.add({ severity: 'error', summary: this.translate.instant('settlements.payment.validationError') });
      return;
    }

    this.submittingPayment = true;
    this.settlementsService
      .addPayment(this.settlementId!, {
        payment_date: this.paymentDate,
        amount: this.amount,
        method: this.method || null,
        notes: this.notes || null
      })
      .subscribe({
        next: () => {
          this.submittingPayment = false;
          this.amount = null;
          this.method = '';
          this.notes = '';
          this.messages.add({ severity: 'success', summary: this.translate.instant('general.saved') });
          this.load();
          this.changed.emit();
        },
        error: (err) => {
          this.submittingPayment = false;
          this.messages.add({
            severity: 'error',
            summary: this.translate.instant('general.saveError'),
            detail: err?.error?.message
          });
        }
      });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
