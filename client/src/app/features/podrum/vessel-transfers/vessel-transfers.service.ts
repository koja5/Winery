import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BulkTransferLine {
  to_vessel_id: string;
  quantity_liters: number;
}

export interface BulkTransferPayload {
  from_vessel_id: string | null;
  aging_id: string | null;
  transfer_date: string;
  reason: string | null;
  notes: string | null;
  lines: BulkTransferLine[];
}

@Injectable({ providedIn: 'root' })
export class VesselTransfersService {
  private http = inject(HttpClient);

  submitBulk(payload: BulkTransferPayload): Observable<{ created: string[] }> {
    return this.http.post<{ created: string[] }>('/api/admin/vessel-transfers/bulk', payload);
  }
}
