import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GridConfig } from '../models/grid-config';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private http = inject(HttpClient);

  getGridConfig(path: string, file: string): Observable<GridConfig> {
    return this.http.get<GridConfig>(`/assets/configurations/${path}/${file}`);
  }
}
