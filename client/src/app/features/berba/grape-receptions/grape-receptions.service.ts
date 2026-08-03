import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReceptionTraceability {
  reception: Record<string, any>;
  pressings: Record<string, any>[];
  agings: Record<string, any>[];
  chargings: Record<string, any>[];
}

export interface ReceptionReceipt {
  reception: Record<string, any>;
  tenant: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class GrapeReceptionsService {
  private http = inject(HttpClient);

  getTraceability(id: string): Observable<ReceptionTraceability> {
    return this.http.get<ReceptionTraceability>(`/api/admin/grape-receptions/${id}/traceability`);
  }

  getReceipt(id: string): Observable<ReceptionReceipt> {
    return this.http.get<ReceptionReceipt>(`/api/admin/grape-receptions/${id}/receipt`);
  }
}
