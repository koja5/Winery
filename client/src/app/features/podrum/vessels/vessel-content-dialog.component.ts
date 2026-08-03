import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { VesselContent, VesselsService } from './vessels.service';

@Component({
  selector: 'app-vessel-content-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, TranslateModule],
  providers: [DatePipe],
  templateUrl: './vessel-content-dialog.component.html',
  styleUrl: './vessel-content-dialog.component.scss'
})
export class VesselContentDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() vesselId: string | null = null;

  private vesselsService = inject(VesselsService);

  loading = false;
  content: VesselContent | null = null;

  ngOnChanges(): void {
    if (this.visible && this.vesselId) {
      this.load();
    }
  }

  private load(): void {
    this.loading = true;
    this.content = null;
    this.vesselsService.getContent(this.vesselId!).subscribe({
      next: (content) => {
        this.content = content;
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
