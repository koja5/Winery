import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DatasetMeta, ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  datasets: DatasetMeta[] = [];
  selectedDataset: DatasetMeta | null = null;
  selectedDimensions: string[] = [];
  selectedMetrics: string[] = [];
  from = '';
  to = '';

  loading = false;
  rows: Record<string, any>[] = [];
  columns: string[] = [];

  ngOnInit(): void {
    this.reportsService.listDatasets().subscribe((datasets) => {
      this.datasets = datasets;
      if (datasets.length) {
        this.selectDataset(datasets[0]);
      }
    });
  }

  selectDataset(dataset: DatasetMeta): void {
    this.selectedDataset = dataset;
    this.selectedDimensions = [];
    this.selectedMetrics = Object.keys(dataset.metrics).slice(0, 1);
    this.rows = [];
    this.columns = [];
  }

  toggleDimension(key: string): void {
    this.selectedDimensions = this.selectedDimensions.includes(key)
      ? this.selectedDimensions.filter((d) => d !== key)
      : [...this.selectedDimensions, key];
  }

  toggleMetric(key: string): void {
    this.selectedMetrics = this.selectedMetrics.includes(key)
      ? this.selectedMetrics.filter((m) => m !== key)
      : [...this.selectedMetrics, key];
  }

  run(): void {
    if (!this.selectedDataset || !this.selectedMetrics.length) return;
    this.loading = true;
    this.reportsService
      .run({
        dataset: this.selectedDataset.name,
        dimensions: this.selectedDimensions,
        metrics: this.selectedMetrics,
        from: this.from || undefined,
        to: this.to || undefined
      })
      .subscribe({
        next: (rows) => {
          this.loading = false;
          this.rows = rows;
          this.columns = rows.length ? Object.keys(rows[0]) : [...this.selectedDimensions, ...this.selectedMetrics];
        },
        error: () => {
          this.loading = false;
          this.rows = [];
        }
      });
  }
}
