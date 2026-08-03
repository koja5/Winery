import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { AnalysisDocumentsDialogComponent } from './analysis-documents-dialog.component';

@Component({
  selector: 'app-wine-analyses',
  standalone: true,
  imports: [DynamicTableComponent, AnalysisDocumentsDialogComponent],
  template: `
    <app-dynamic-table path="grids/admin" file="wine-analyses.json" (rowAction)="onRowAction($event)"></app-dynamic-table>
    <app-analysis-documents-dialog [(visible)]="documentsDialogVisible" [analysisId]="selectedAnalysisId"></app-analysis-documents-dialog>
  `
})
export class WineAnalysesComponent {
  documentsDialogVisible = false;
  selectedAnalysisId: string | null = null;

  onRowAction(event: { key: string | undefined; row: any }): void {
    if (event.key === 'view-documents') {
      this.selectedAnalysisId = event.row.id;
      this.documentsDialogVisible = true;
    }
  }
}
