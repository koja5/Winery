import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentLink {
  link_id: string;
  id: string;
  name: string;
  path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface DocumentLibraryItem {
  id: string;
  name: string;
  path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  entity_types: string | null;
  links_count: number;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private http = inject(HttpClient);
  private base = '/api/admin/documents';

  list(entityType: string, entityId: string): Observable<DocumentLink[]> {
    return this.http.get<DocumentLink[]>(`${this.base}/list/${entityType}/${entityId}`);
  }

  upload(entityType: string, entityId: string, files: File[]): Observable<{ id: string; name: string }[]> {
    const form = new FormData();
    form.append('entity_type', entityType);
    form.append('entity_id', entityId);
    files.forEach((file) => form.append('files', file));
    return this.http.post<{ id: string; name: string }[]>(`${this.base}/upload`, form);
  }

  unlink(linkId: string): Observable<{ unlinked: boolean }> {
    return this.http.post<{ unlinked: boolean }>(`${this.base}/unlink`, { link_id: linkId });
  }

  downloadUrl(documentId: string): string {
    return `${this.base}/${documentId}/download`;
  }

  /** Global document library for a tenant (the standalone "Dokumentacija" page), ?search= by name. */
  library(search?: string): Observable<DocumentLibraryItem[]> {
    const params: Record<string, string> = search ? { search } : {};
    return this.http.get<DocumentLibraryItem[]>(`${this.base}/library`, { params });
  }

  uploadLibrary(files: File[]): Observable<{ id: string; name: string; path: string }[]> {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return this.http.post<{ id: string; name: string; path: string }[]>(`${this.base}/upload-library`, form);
  }

  remove(documentId: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/${documentId}`);
  }
}
