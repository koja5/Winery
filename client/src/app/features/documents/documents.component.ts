import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DocumentLibraryItem, DocumentsService } from '../../core/services/documents.service';

/**
 * Global document library — "Dokumentacija" page. Modeled after eDestilerija's
 * generic documents grid (upload-library / library / delete endpoints), but
 * hand-built here since this project's config-driven dynamic-table has no
 * uploader field type or preview/attachment column templates.
 */
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService, DatePipe],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent implements OnInit {
  @ViewChild('dt') table?: Table;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private documentsService = inject(DocumentsService);
  private confirmation = inject(ConfirmationService);
  private messages = inject(MessageService);
  private translate = inject(TranslateService);
  private datePipe = inject(DatePipe);

  readonly currentPageReportTemplate = 'Prikazano {first}-{last} od ukupno {totalRecords} podataka.';

  documents: DocumentLibraryItem[] = [];
  loading = false;
  uploading = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.documentsService.library().subscribe({
      next: (docs) => {
        this.documents = docs || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: this.translate.instant('general.loadError') });
      }
    });
  }

  onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.table?.filterGlobal(value, 'contains');
  }

  triggerUpload(): void {
    this.fileInput?.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    this.uploading = true;
    this.documentsService.uploadLibrary(files).subscribe({
      next: () => {
        input.value = '';
        this.uploading = false;
        this.messages.add({ severity: 'success', summary: this.translate.instant('general.saved') });
        this.load();
      },
      error: (err) => {
        input.value = '';
        this.uploading = false;
        this.messages.add({
          severity: 'error',
          summary: this.translate.instant('general.saveError'),
          detail: err?.error?.message
        });
      }
    });
  }

  confirmDelete(doc: DocumentLibraryItem): void {
    this.confirmation.confirm({
      message: this.translate.instant('documents.confirmDeleteMessage'),
      header: this.translate.instant('general.confirmDeleteTitle'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.performDelete(doc)
    });
  }

  private performDelete(doc: DocumentLibraryItem): void {
    this.documentsService.remove(doc.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.translate.instant('general.deleted') });
        this.load();
      },
      error: (err) => {
        this.messages.add({
          severity: 'error',
          summary: this.translate.instant('general.deleteError'),
          detail: err?.error?.message
        });
      }
    });
  }

  downloadUrl(doc: DocumentLibraryItem): string {
    return this.documentsService.downloadUrl(doc.id);
  }

  formatDate(value: string): string {
    return this.datePipe.transform(value, 'dd.MM.yyyy HH:mm') || '';
  }

  formatSize(bytes: number | null): string {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  attachedToLabel(doc: DocumentLibraryItem): string {
    if (!doc.entity_types) return this.translate.instant('documents.notAttached');
    return doc.entity_types
      .split(',')
      .map((type) => type.trim())
      .join(', ');
  }
}
