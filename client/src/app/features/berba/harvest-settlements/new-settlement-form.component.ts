import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AppButtonComponent } from '../../../shared/components/button/button.component';
import { HarvestSettlementsService, UnsettledReception } from './harvest-settlements.service';
import { toLocalDateInputValue } from '../../../core/utils/date.util';

@Component({
  selector: 'app-new-settlement-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, TranslateModule, ToastModule, AppButtonComponent],
  providers: [MessageService],
  templateUrl: './new-settlement-form.component.html',
  styleUrl: './new-settlement-form.component.scss'
})
export class NewSettlementFormComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  private http = inject(HttpClient);
  private settlementsService = inject(HarvestSettlementsService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);

  suppliers: Record<string, any>[] = [];
  receptions: UnsettledReception[] = [];
  selectedIds = new Set<string>();
  loading = false;

  supplierId = '';
  settlementDate = toLocalDateInputValue(new Date());
  pricePerKg: number | null = null;
  notes = '';

  ngOnChanges(): void {
    if (this.visible) {
      this.reset();
      this.http.get<Record<string, any>[]>('/api/admin/suppliers').subscribe((suppliers) => (this.suppliers = suppliers));
    }
  }

  onSupplierChange(): void {
    this.receptions = [];
    this.selectedIds.clear();
    if (!this.supplierId) return;
    this.settlementsService.getUnsettledReceptions(this.supplierId).subscribe((rows) => (this.receptions = rows));
  }

  toggleReception(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  get selectedQuantity(): number {
    return this.receptions
      .filter((r) => this.selectedIds.has(r.id))
      .reduce((sum, r) => sum + Number(r.quantity_kg), 0);
  }

  get totalAmount(): number {
    return Math.round(this.selectedQuantity * (this.pricePerKg || 0) * 100) / 100;
  }

  submit(): void {
    if (!this.supplierId || !this.pricePerKg || this.pricePerKg <= 0 || this.selectedIds.size === 0) {
      this.messages.add({ severity: 'error', summary: this.translate.instant('settlements.form.validationError') });
      return;
    }

    this.loading = true;
    this.settlementsService
      .create({
        supplier_id: this.supplierId,
        settlement_date: this.settlementDate,
        price_per_kg: this.pricePerKg,
        reception_ids: [...this.selectedIds],
        notes: this.notes || null
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.messages.add({ severity: 'success', summary: this.translate.instant('general.saved') });
          this.saved.emit();
          this.close();
        },
        error: (err) => {
          this.loading = false;
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

  private reset(): void {
    this.supplierId = '';
    this.settlementDate = toLocalDateInputValue(new Date());
    this.pricePerKg = null;
    this.notes = '';
    this.receptions = [];
    this.selectedIds.clear();
  }
}
