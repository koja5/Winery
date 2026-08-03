import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { SoilAnalysisDocumentsDialogComponent } from './soil-analysis-documents-dialog.component';

@Component({
  selector: 'app-soil-analyses',
  standalone: true,
  imports: [DynamicTableComponent, SoilAnalysisDocumentsDialogComponent],
  template: `
    <app-dynamic-table path="grids/admin" file="soil-analyses.json" (rowAction)="onRowAction($event)"></app-dynamic-table>
    <app-soil-analysis-documents-dialog [(visible)]="documentsDialogVisible" [analysisId]="selectedAnalysisId"></app-soil-analysis-documents-dialog>
  `
})
export class SoilAnalysesComponent {
  documentsDialogVisible = false;
  selectedAnalysisId: string | null = null;

  onRowAction(event: { key: string | undefined; row: any }): void {
    if (event.key === 'view-documents') {
      this.selectedAnalysisId = event.row.id;
      this.documentsDialogVisible = true;
    }
  }
}
