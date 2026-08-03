import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VesselContent {
  vessel: Record<string, any>;
  fermentations: Record<string, any>[];
  agings: Record<string, any>[];
  recentTransfers: Record<string, any>[];
}

@Injectable({ providedIn: 'root' })
export class VesselsService {
  private http = inject(HttpClient);

  list(): Observable<Record<string, any>[]> {
    return this.http.get<Record<string, any>[]>('/api/admin/wine-vessels');
  }

  getContent(vesselId: string): Observable<VesselContent> {
    return this.http.get<VesselContent>(`/api/admin/wine-vessels/${vesselId}/content`);
  }
}
