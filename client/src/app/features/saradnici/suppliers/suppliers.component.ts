import { Component } from '@angular/core';
import { DynamicTableComponent } from '../../../shared/dynamic-table/dynamic-table.component';

// Isti entitet kao dobavljači berbe (tabela/API `suppliers`) — "Saradnici" meni
// je samo drugi ulaz ka istim podacima, bez potrebe za duplim modelom.
@Component({
  selector: 'app-saradnici-suppliers',
  standalone: true,
  imports: [DynamicTableComponent],
  template: `<app-dynamic-table path="grids/admin" file="suppliers.json"></app-dynamic-table>`
})
export class SaradniciSuppliersComponent {}
