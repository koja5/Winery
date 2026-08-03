import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentsPanelComponent } from '../../../shared/documents-panel/documents-panel.component';

@Component({
  selector: 'app-soil-analysis-documents-dialog',
  standalone: true,
  imports: [DialogModule, TranslateModule, DocumentsPanelComponent],
  template: `
    <p-dialog
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [style]="{ width: '28rem' }"
      [header]="'documents.title' | translate"
    >
      @if (visible && analysisId) {
        <app-documents-panel entityType="soil_analysis" [entityId]="analysisId"></app-documents-panel>
      }
    </p-dialog>
  `
})
export class SoilAnalysisDocumentsDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() analysisId: string | null = null;
}
