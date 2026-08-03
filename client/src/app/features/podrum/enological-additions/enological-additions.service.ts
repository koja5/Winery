import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BulkAdditionPayload {
  vessel_ids: string[];
  addition_date: string;
  additive_name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class EnologicalAdditionsService {
  private http = inject(HttpClient);

  submitBulk(payload: BulkAdditionPayload): Observable<{ created: string[] }> {
    return this.http.post<{ created: string[] }>('/api/admin/enological-additions/bulk', payload);
  }
}
