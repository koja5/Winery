import { Component, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { BulkAdditionFormComponent } from './bulk-addition-form.component';
import { AppButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-enological-additions',
  standalone: true,
  imports: [TranslateModule, DynamicTableComponent, BulkAdditionFormComponent, AppButtonComponent],
  templateUrl: './enological-additions.component.html',
  styleUrl: './enological-additions.component.scss'
})
export class EnologicalAdditionsComponent {
  @ViewChild(DynamicTableComponent) grid?: DynamicTableComponent;

  formVisible = false;

  onSaved(): void {
    this.grid?.loadData();
  }
}
