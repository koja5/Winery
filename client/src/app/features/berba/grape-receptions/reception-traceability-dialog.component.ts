import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { GrapeReceptionsService, ReceptionTraceability } from './grape-receptions.service';

@Component({
  selector: 'app-reception-traceability-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, TranslateModule],
  providers: [DatePipe],
  templateUrl: './reception-traceability-dialog.component.html',
  styleUrl: './reception-traceability-dialog.component.scss'
})
export class ReceptionTraceabilityDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() receptionId: string | null = null;

  private receptionsService = inject(GrapeReceptionsService);

  loading = false;
  data: ReceptionTraceability | null = null;

  ngOnChanges(): void {
    if (this.visible && this.receptionId) {
      this.load();
    }
  }

  private load(): void {
    this.loading = true;
    this.data = null;
    this.receptionsService.getTraceability(this.receptionId!).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
