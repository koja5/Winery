import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';
import { ReceptionTraceabilityDialogComponent } from './reception-traceability-dialog.component';
import { GrapeReceptionsService } from './grape-receptions.service';
import { PrintService } from '../../../shared/services/print.service';

@Component({
  selector: 'app-grape-receptions',
  standalone: true,
  imports: [DynamicTableComponent, ReceptionTraceabilityDialogComponent],
  providers: [DatePipe],
  template: `
    <app-dynamic-table path="grids/admin" file="grape-receptions.json" (rowAction)="onRowAction($event)"></app-dynamic-table>
    <app-reception-traceability-dialog [(visible)]="traceabilityVisible" [receptionId]="selectedReceptionId"></app-reception-traceability-dialog>
  `
})
export class GrapeReceptionsComponent {
  private receptionsService = inject(GrapeReceptionsService);
  private printService = inject(PrintService);
  private datePipe = inject(DatePipe);

  traceabilityVisible = false;
  selectedReceptionId: string | null = null;

  onRowAction(event: { key: string | undefined; row: any }): void {
    if (event.key === 'traceability') {
      this.selectedReceptionId = event.row.id;
      this.traceabilityVisible = true;
    } else if (event.key === 'print-receipt') {
      this.printReceipt(event.row.id);
    }
  }

  private printReceipt(id: string): void {
    this.receptionsService.getReceipt(id).subscribe((data) => {
      this.printService.printHtml(this.buildReceiptHtml(data));
    });
  }

  private buildReceiptHtml(data: { reception: Record<string, any>; tenant: Record<string, any> }): string {
    const r = data.reception;
    const date = this.datePipe.transform(r['reception_date'], 'dd.MM.yyyy') || '';
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Potvrda o prijemu</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; color: #2a1f1a; }
            h1 { font-size: 1.3rem; margin-bottom: 0.2rem; }
            .sub { color: #7a6a5e; margin-bottom: 1.5rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            td { padding: 0.4rem 0.2rem; border-bottom: 1px solid #e2d5c5; }
            td:first-child { color: #7a6a5e; width: 40%; }
            .signatures { display: flex; justify-content: space-between; margin-top: 4rem; }
            .signatures div { text-align: center; width: 40%; border-top: 1px solid #2a1f1a; padding-top: 0.3rem; }
          </style>
        </head>
        <body>
          <h1>${data.tenant?.['name'] || ''}</h1>
          <div class="sub">Potvrda o prijemu grožđa</div>
          <table>
            <tr><td>Datum prijema</td><td>${date}</td></tr>
            <tr><td>Dobavljač</td><td>${r['supplier_display_name'] || '—'}</td></tr>
            <tr><td>Parcela</td><td>${r['parcel_name'] || '—'}</td></tr>
            <tr><td>Sorta grožđa</td><td>${r['grape_variety'] || '—'}</td></tr>
            <tr><td>Količina</td><td>${r['quantity_kg']} kg</td></tr>
            <tr><td>Šećer (°Oe)</td><td>${r['sugar_degrees'] ?? '—'}</td></tr>
          </table>
          <div class="signatures">
            <div>Predao</div>
            <div>Primio</div>
          </div>
        </body>
      </html>
    `;
  }
}
