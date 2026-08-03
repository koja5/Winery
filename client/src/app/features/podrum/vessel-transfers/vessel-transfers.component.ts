import { Component, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { BulkTransferFormComponent } from './bulk-transfer-form.component';
import { AppButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-vessel-transfers',
  standalone: true,
  imports: [TranslateModule, DynamicTableComponent, BulkTransferFormComponent, AppButtonComponent],
  templateUrl: './vessel-transfers.component.html',
  styleUrl: './vessel-transfers.component.scss'
})
export class VesselTransfersComponent {
  @ViewChild(DynamicTableComponent) grid?: DynamicTableComponent;

  formVisible = false;

  onSaved(): void {
    this.grid?.loadData();
  }
}
