import { Component, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { SearchService, GlobalSearchGroup, GlobalSearchItem } from '../../../../../core/services/search.service';

const MIN_QUERY_LENGTH = 2;

const GROUP_ICONS: Record<string, string> = {
  supplier: 'pi pi-truck',
  reception: 'pi pi-sun',
  vessel: 'pi pi-box',
  work_order: 'pi pi-calendar-clock'
};

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.scss'
})
export class GlobalSearchComponent implements OnDestroy {
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  term = '';
  isOpen = false;
  isLoading = false;
  mobileExpanded = false;
  groups: GlobalSearchGroup[] = [];

  private searchService = inject(SearchService);
  private router = inject(Router);
  private elRef = inject(ElementRef);

  private term$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.term$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.length < MIN_QUERY_LENGTH) {
            this.isLoading = false;
            return of({ groups: [] });
          }
          this.isLoading = true;
          return this.searchService.search(term);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.groups = response?.groups ?? [];
        },
        error: () => {
          this.isLoading = false;
          this.groups = [];
        }
      });
  }

  onInputChange(): void {
    this.isOpen = true;
    if (this.term.trim().length < MIN_QUERY_LENGTH) this.groups = [];
    this.term$.next(this.term.trim());
  }

  onFocus(): void {
    this.isOpen = true;
  }

  expandMobile(): void {
    this.mobileExpanded = true;
  }

  onMobileDialogShow(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.searchInputRef?.nativeElement?.focus());
    });
  }

  onResultClick(item: GlobalSearchItem): void {
    this.close();
    this.router.navigateByUrl(item.route);
  }

  onEscape(): void {
    this.close();
  }

  close(): void {
    this.isOpen = false;
    this.mobileExpanded = false;
    this.term = '';
    this.groups = [];
  }

  getIcon(type: string): string {
    return GROUP_ICONS[type] ?? 'pi pi-search';
  }

  get hasResults(): boolean {
    return this.groups.some((g) => g.items.length > 0);
  }

  get showEmptyState(): boolean {
    return !this.isLoading && this.term.trim().length >= MIN_QUERY_LENGTH && !this.hasResults;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.mobileExpanded) return;
    if (!this.elRef.nativeElement.contains(event.target)) this.isOpen = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
