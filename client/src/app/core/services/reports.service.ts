import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DatasetMeta {
  name: string;
  label: string;
  dimensions: Record<string, { label: string }>;
  metrics: Record<string, { label: string }>;
  hasDateRange: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private base = '/api/admin/reports';

  listDatasets(): Observable<DatasetMeta[]> {
    return this.http.get<DatasetMeta[]>(`${this.base}/datasets`);
  }

  run(payload: {
    dataset: string;
    dimensions: string[];
    metrics: string[];
    from?: string;
    to?: string;
  }): Observable<Record<string, any>[]> {
    return this.http.post<Record<string, any>[]>(`${this.base}/run`, payload);
  }
}
