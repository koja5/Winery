import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { VesselContentDialogComponent } from './vessel-content-dialog.component';

@Component({
  selector: 'app-vessels',
  standalone: true,
  imports: [DynamicTableComponent, VesselContentDialogComponent],
  template: `
    <app-dynamic-table path="grids/admin" file="wine-vessels.json" (rowAction)="onRowAction($event)"></app-dynamic-table>
    <app-vessel-content-dialog [(visible)]="contentDialogVisible" [vesselId]="selectedVesselId"></app-vessel-content-dialog>
  `
})
export class VesselsComponent {
  contentDialogVisible = false;
  selectedVesselId: string | null = null;

  onRowAction(event: { key: string | undefined; row: any }): void {
    if (event.key === 'view-content') {
      this.selectedVesselId = event.row.id;
      this.contentDialogVisible = true;
    }
  }
}
