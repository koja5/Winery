import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AppButtonComponent } from '../../../shared/components/button/button.component';
import { VesselsService } from '../vessels/vessels.service';
import { BulkTransferLine, VesselTransfersService } from './vessel-transfers.service';
import { toLocalDateInputValue } from '../../../core/utils/date.util';

@Component({
  selector: 'app-bulk-transfer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, TranslateModule, ToastModule, AppButtonComponent],
  providers: [MessageService],
  templateUrl: './bulk-transfer-form.component.html',
  styleUrl: './bulk-transfer-form.component.scss'
})
export class BulkTransferFormComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  private vesselsService = inject(VesselsService);
  private transfersService = inject(VesselTransfersService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);

  vessels: Record<string, any>[] = [];
  loading = false;

  fromVesselId: string | null = null;
  transferDate = toLocalDateInputValue(new Date());
  reason = '';
  notes = '';
  lines: BulkTransferLine[] = [{ to_vessel_id: '', quantity_liters: 0 }];

  ngOnChanges(): void {
    if (this.visible) {
      this.reset();
      this.vesselsService.list().subscribe((vessels) => (this.vessels = vessels));
    }
  }

  addLine(): void {
    this.lines.push({ to_vessel_id: '', quantity_liters: 0 });
  }

  removeLine(index: number): void {
    this.lines.splice(index, 1);
  }

  get totalQuantity(): number {
    return this.lines.reduce((sum, l) => sum + (Number(l.quantity_liters) || 0), 0);
  }

  submit(): void {
    const validLines = this.lines.filter((l) => l.to_vessel_id && l.quantity_liters > 0);
    if (!validLines.length || !this.transferDate) {
      this.messages.add({ severity: 'error', summary: this.translate.instant('transfers.form.validationError') });
      return;
    }

    this.loading = true;
    this.transfersService
      .submitBulk({
        from_vessel_id: this.fromVesselId,
        aging_id: null,
        transfer_date: this.transferDate,
        reason: this.reason || null,
        notes: this.notes || null,
        lines: validLines
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
    this.fromVesselId = null;
    this.transferDate = toLocalDateInputValue(new Date());
    this.reason = '';
    this.notes = '';
    this.lines = [{ to_vessel_id: '', quantity_liters: 0 }];
  }
}
