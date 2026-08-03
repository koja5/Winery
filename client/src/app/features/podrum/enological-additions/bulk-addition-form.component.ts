import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AppButtonComponent } from '../../../shared/components/button/button.component';
import { VesselsService } from '../vessels/vessels.service';
import { EnologicalAdditionsService } from './enological-additions.service';
import { toLocalDateInputValue } from '../../../core/utils/date.util';

@Component({
  selector: 'app-bulk-addition-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, TranslateModule, ToastModule, AppButtonComponent],
  providers: [MessageService],
  templateUrl: './bulk-addition-form.component.html',
  styleUrl: './bulk-addition-form.component.scss'
})
export class BulkAdditionFormComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  private vesselsService = inject(VesselsService);
  private additionsService = inject(EnologicalAdditionsService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);

  vessels: Record<string, any>[] = [];
  selectedVesselIds = new Set<string>();
  loading = false;

  additionDate = toLocalDateInputValue(new Date());
  additiveName = '';
  quantity: number | null = null;
  unit = 'g';
  notes = '';

  ngOnChanges(): void {
    if (this.visible) {
      this.reset();
      this.vesselsService.list().subscribe((vessels) => (this.vessels = vessels));
    }
  }

  toggleVessel(id: string): void {
    this.selectedVesselIds.has(id) ? this.selectedVesselIds.delete(id) : this.selectedVesselIds.add(id);
  }

  isSelected(id: string): boolean {
    return this.selectedVesselIds.has(id);
  }

  submit(): void {
    if (!this.selectedVesselIds.size || !this.additiveName || !this.additionDate) {
      this.messages.add({ severity: 'error', summary: this.translate.instant('additions.form.validationError') });
      return;
    }

    this.loading = true;
    this.additionsService
      .submitBulk({
        vessel_ids: Array.from(this.selectedVesselIds),
        addition_date: this.additionDate,
        additive_name: this.additiveName,
        quantity: this.quantity,
        unit: this.unit || null,
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
    this.selectedVesselIds = new Set<string>();
    this.additionDate = toLocalDateInputValue(new Date());
    this.additiveName = '';
    this.quantity = null;
    this.unit = 'g';
    this.notes = '';
  }
}
