import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UnsettledReception {
  id: string;
  reception_date: string;
  grape_variety: string;
  quantity_kg: number;
}

export interface NewSettlementPayload {
  supplier_id: string;
  settlement_date: string;
  price_per_kg: number;
  reception_ids: string[];
  notes: string | null;
}

export interface SettlementDetail {
  settlement: Record<string, any>;
  receptions: Record<string, any>[];
  payments: Record<string, any>[];
}

export interface NewPaymentPayload {
  payment_date: string;
  amount: number;
  method: string | null;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class HarvestSettlementsService {
  private http = inject(HttpClient);

  getUnsettledReceptions(supplierId: string): Observable<UnsettledReception[]> {
    return this.http.get<UnsettledReception[]>('/api/admin/harvest-settlements/unsettled-receptions', {
      params: { supplier_id: supplierId }
    });
  }

  create(payload: NewSettlementPayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/admin/harvest-settlements', payload);
  }

  getDetail(id: string): Observable<SettlementDetail> {
    return this.http.get<SettlementDetail>(`/api/admin/harvest-settlements/${id}`);
  }

  addPayment(id: string, payload: NewPaymentPayload): Observable<{ created: boolean }> {
    return this.http.post<{ created: boolean }>(`/api/admin/harvest-settlements/${id}/payments`, payload);
  }
}
