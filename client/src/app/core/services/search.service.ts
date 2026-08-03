import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GlobalSearchItem {
  id: string;
  label: string;
  subtitle: string | null;
  route: string;
}

export interface GlobalSearchGroup {
  type: string;
  label: string;
  items: GlobalSearchItem[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);

  search(q: string): Observable<{ groups: GlobalSearchGroup[] }> {
    return this.http.get<{ groups: GlobalSearchGroup[] }>('/api/admin/search', { params: { q } });
  }
}
