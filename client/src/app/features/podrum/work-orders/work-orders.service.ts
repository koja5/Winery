import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkOrdersService {
  private http = inject(HttpClient);

  list(): Observable<Record<string, any>[]> {
    return this.http.get<Record<string, any>[]>('/api/admin/work-orders');
  }
}
