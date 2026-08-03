import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DocumentLink, DocumentsService } from '../../core/services/documents.service';

/**
 * Drop-in attachments widget for any entity edit dialog: pass entityType +
 * entityId, get list/upload/remove for free. Backed by the generic
 * documents/document_links tables (T0.6) — files can be reused across
 * entities without re-uploading.
 */
@Component({
  selector: 'app-documents-panel',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule],
  templateUrl: './documents-panel.component.html',
  styleUrl: './documents-panel.component.scss'
})
export class DocumentsPanelComponent implements OnChanges {
  @Input({ required: true }) entityType!: string;
  @Input({ required: true }) entityId!: string;

  private documentsService = inject(DocumentsService);

  documents: DocumentLink[] = [];
  loading = false;

  ngOnChanges(): void {
    if (this.entityType && this.entityId) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.documentsService.list(this.entityType, this.entityId).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    this.documentsService.upload(this.entityType, this.entityId, files).subscribe(() => {
      input.value = '';
      this.load();
    });
  }

  remove(doc: DocumentLink): void {
    this.documentsService.unlink(doc.link_id).subscribe(() => this.load());
  }

  downloadUrl(doc: DocumentLink): string {
    return this.documentsService.downloadUrl(doc.id);
  }
}
