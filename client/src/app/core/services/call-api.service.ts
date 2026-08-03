import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RequestModel } from '../models/request-model';

@Injectable({ providedIn: 'root' })
export class CallApiService {
  private http = inject(HttpClient);

  /**
   * Fires the HTTP call described by a RequestModel, substituting `:param`
   * placeholders in the api path from `params` (by position, matching
   * `request.parameters`), and sending only `request.fields` from `body`
   * when provided (otherwise the whole body).
   */
  call<T = any>(request: RequestModel, body?: any, params?: Record<string, string>): Observable<T> {
    const url = this.resolveUrl(request, params);
    const payload = this.resolveBody(request, body);

    let call$: Observable<any>;
    switch (request.type) {
      case 'GET':
        call$ = this.http.get(url);
        break;
      case 'POST':
        call$ = this.http.post(url, payload);
        break;
      case 'PUT':
        call$ = this.http.put(url, payload);
        break;
      case 'DELETE':
        call$ = this.http.delete(url);
        break;
    }

    return call$.pipe(map((response) => (request.root ? response?.[request.root] : response)));
  }

  private resolveUrl(request: RequestModel, params?: Record<string, string>): string {
    if (!params) {
      return request.api;
    }
    let url = request.api;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    }
    return url;
  }

  private resolveBody(request: RequestModel, body?: any): any {
    if (!body || !request.fields || !request.fields.length) {
      return body;
    }
    const subset: Record<string, any> = {};
    for (const field of request.fields) {
      subset[field] = body[field];
    }
    return subset;
  }
}
