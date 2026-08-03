import { Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { GridConfig } from '../../core/models/grid-config';
import { ColumnConfig, ActionDef } from '../../core/models/column-config';
import { ColumnType } from '../../core/enums/column-type.enum';
import { Action, DANGER_ACTIONS } from '../../core/enums/action.enum';
import { ConfigurationService } from '../../core/services/configuration.service';
import { CallApiService } from '../../core/services/call-api.service';
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    MenuModule,
    DialogModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    DynamicFormsComponent
  ],
  providers: [ConfirmationService, MessageService, DatePipe],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss'
})
export class DynamicTableComponent implements OnInit {
  @Input({ required: true }) path!: string;
  @Input({ required: true }) file!: string;

  /** fired for row actions of type "emit" — host page handles them by action.key */
  @Output() rowAction = new EventEmitter<{ key: string | undefined; row: any }>();

  @ViewChild('rowActionMenu') rowActionMenu?: Menu;

  readonly ColumnType = ColumnType;

  private configService = inject(ConfigurationService);
  private api = inject(CallApiService);
  private confirmation = inject(ConfirmationService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);
  private datePipe = inject(DatePipe);

  config: GridConfig | null = null;
  rows: any[] = [];
  loading = false;

  dataColumns: ColumnConfig[] = [];
  hasRowActions = false;

  rowMenuItems: MenuItem[] = [];
  dialogVisible = false;
  editingRow: Record<string, any> | null = null;
  isEdit = false;

  ngOnInit(): void {
    this.configService.getGridConfig(this.path, this.file).subscribe((config) => {
      this.config = config;
      this.dataColumns = config.columns.filter((c) => !c.actions);
      this.hasRowActions = config.columns.some((c) => !!c.actions?.length);
      this.loadData();
    });
  }

  loadData(): void {
    if (!this.config) return;
    this.loading = true;
    this.api.call<any[]>(this.config.request).subscribe({
      next: (rows) => {
        this.rows = rows || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: this.translate.instant('general.loadError') });
      }
    });
  }

  formatValue(row: any, column: ColumnConfig): string {
    const value = row[column.field];
    if (value === null || value === undefined) return '';

    if (column.translateMap && column.translateMap[value]) {
      return this.translate.instant(column.translateMap[value]);
    }

    switch (column.type) {
      case ColumnType.Date:
        return this.datePipe.transform(value, column.format || 'dd.MM.yyyy') || '';
      case ColumnType.Number:
        return Number(value).toLocaleString('sr-RS');
      case ColumnType.Boolean:
        return this.translate.instant(value ? 'general.yes' : 'general.no');
      default:
        return String(value);
    }
  }

  openRowMenu(event: Event, row: any): void {
    this.rowMenuItems = this.buildRowMenuItems(row);
    this.rowActionMenu?.toggle(event);
  }

  private buildRowMenuItems(row: any): MenuItem[] {
    if (!this.config) return [];
    const actionColumn = this.config.columns.find((c) => c.actions?.length);
    const actions = actionColumn?.actions || [];

    const primary: MenuItem[] = [];
    const danger: MenuItem[] = [];

    for (const action of actions) {
      const item: MenuItem = {
        label: this.translate.instant(action.title),
        icon: action.icon,
        command: () => this.handleAction(action, row)
      };
      if (DANGER_ACTIONS.has(action.type)) {
        item.styleClass = 'menu-item-danger';
        danger.push(item);
      } else {
        primary.push(item);
      }
    }

    if (primary.length && danger.length) {
      return [...primary, { separator: true }, ...danger];
    }
    return [...primary, ...danger];
  }

  private handleAction(action: ActionDef, row: any): void {
    if (action.type === Action.Edit) {
      this.openEdit(row);
    } else if (action.type === Action.Delete) {
      this.confirmDelete(row);
    } else if (action.type === Action.Emit) {
      this.rowAction.emit({ key: action.key, row });
    }
  }

  createNewEntry(): void {
    this.editingRow = {};
    this.isEdit = false;
    this.dialogVisible = true;
  }

  openEdit(row: any): void {
    this.editingRow = { ...row };
    this.isEdit = true;
    this.dialogVisible = true;
  }

  onFormSave(value: Record<string, any>): void {
    if (!this.config?.save) return;
    const payload = this.isEdit ? { ...this.editingRow, ...value } : value;
    this.api.call(this.config.save, payload).subscribe({
      next: () => {
        this.dialogVisible = false;
        this.messages.add({ severity: 'success', summary: this.translate.instant('general.saved') });
        this.loadData();
      },
      error: (err) => {
        this.messages.add({
          severity: 'error',
          summary: this.translate.instant('general.saveError'),
          detail: err?.error?.message
        });
      }
    });
  }

  onFormCancel(): void {
    this.dialogVisible = false;
  }

  private confirmDelete(row: any): void {
    if (!this.config?.delete) return;
    this.confirmation.confirm({
      message: this.translate.instant('general.confirmDeleteMessage'),
      header: this.translate.instant('general.confirmDeleteTitle'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.performDelete(row)
    });
  }

  private performDelete(row: any): void {
    if (!this.config?.delete || !this.config.dataKey) return;
    const id = row[this.config.dataKey];
    this.api.call(this.config.delete, null, { id }).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.translate.instant('general.deleted') });
        this.loadData();
      },
      error: (err) => {
        this.messages.add({
          severity: 'error',
          summary: this.translate.instant('general.deleteError'),
          detail: err?.error?.message
        });
      }
    });
  }
}
