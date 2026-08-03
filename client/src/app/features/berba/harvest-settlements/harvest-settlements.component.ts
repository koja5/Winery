import { Component, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { AppButtonComponent } from '../../../shared/components/button/button.component';
import { NewSettlementFormComponent } from './new-settlement-form.component';
import { SettlementDetailDialogComponent } from './settlement-detail-dialog.component';

@Component({
  selector: 'app-harvest-settlements',
  standalone: true,
  imports: [TranslateModule, DynamicTableComponent, AppButtonComponent, NewSettlementFormComponent, SettlementDetailDialogComponent],
  templateUrl: './harvest-settlements.component.html',
  styleUrl: './harvest-settlements.component.scss'
})
export class HarvestSettlementsComponent {
  @ViewChild(DynamicTableComponent) grid?: DynamicTableComponent;

  formVisible = false;
  detailVisible = false;
  selectedSettlementId: string | null = null;

  onRowAction(event: { key: string | undefined; row: any }): void {
    if (event.key === 'view-pay') {
      this.selectedSettlementId = event.row.id;
      this.detailVisible = true;
    }
  }

  onSaved(): void {
    this.grid?.loadData();
  }
}
