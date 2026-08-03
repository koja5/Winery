import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DatasetMeta, ReportsService } from '../../../core/services/reports.service';
import * as L from 'leaflet';

interface ParcelRow {
  id: string;
  name: string;
  geo_boundary?: any;
}

const SERBIA_CENTER: L.LatLngExpression = [44.0, 20.9];

// svetla -> tamna nijansa --ev-primary akcenta, za intenzitet choropleth sloja
const COLOR_LOW: [number, number, number] = [0xf6, 0xe9, 0xec];
const COLOR_HIGH: [number, number, number] = [0x7d, 0x1f, 0x36];

@Component({
  selector: 'app-geo-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SelectModule, ButtonModule],
  templateUrl: './geo-reports.component.html',
  styleUrl: './geo-reports.component.scss'
})
export class GeoReportsComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private reportsService = inject(ReportsService);
  private translate = inject(TranslateService);

  datasets: DatasetMeta[] = [];
  selectedDataset: DatasetMeta | null = null;
  selectedMetric: string | null = null;
  from = '';
  to = '';
  loading = false;
  hasResults = false;

  private map!: L.Map;
  private parcels: ParcelRow[] = [];
  private choroplethLayer!: L.LayerGroup;

  objectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
  }

  ngOnInit(): void {
    this.reportsService.listDatasets().subscribe((datasets) => {
      this.datasets = datasets.filter((ds) => !!ds.dimensions['parcel']);
      if (this.datasets.length) {
        this.selectDataset(this.datasets[0]);
      }
    });

    this.http.get<ParcelRow[]>('/api/admin/vineyard-parcels').subscribe((rows) => {
      this.parcels = rows;
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  selectDataset(dataset: DatasetMeta): void {
    this.selectedDataset = dataset;
    this.selectedMetric = Object.keys(dataset.metrics)[0] || null;
    this.hasResults = false;
    this.choroplethLayer?.clearLayers();
  }

  run(): void {
    if (!this.selectedDataset || !this.selectedMetric) return;

    this.loading = true;
    this.reportsService
      .run({
        dataset: this.selectedDataset.name,
        dimensions: ['parcel'],
        metrics: [this.selectedMetric],
        from: this.from || undefined,
        to: this.to || undefined
      })
      .subscribe({
        next: (rows) => {
          this.loading = false;
          this.hasResults = true;
          this.renderChoropleth(rows, this.selectedMetric as string);
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private initMap(): void {
    this.map = L.map('geo-reports-map').setView(SERBIA_CENTER, 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.choroplethLayer = L.layerGroup().addTo(this.map);
  }

  private renderChoropleth(rows: Record<string, any>[], metricKey: string): void {
    this.choroplethLayer.clearLayers();

    const valueByParcel = new Map<string, number>();
    for (const row of rows) {
      const value = Number(row[metricKey]);
      if (row['parcel'] && !Number.isNaN(value)) {
        valueByParcel.set(row['parcel'], value);
      }
    }

    const values = [...valueByParcel.values()];
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;

    const bounds = L.latLngBounds([]);

    for (const parcel of this.parcels) {
      if (!parcel.geo_boundary) continue;
      const value = valueByParcel.get(parcel.name);
      const color = value === undefined ? '#c9c9c9' : this.colorForValue(value, min, max);

      const layer = L.geoJSON(parcel.geo_boundary, {
        style: { color: '#5a5a5a', weight: 1, fillColor: color, fillOpacity: 0.65 }
      }).bindTooltip(`${parcel.name}${value !== undefined ? `: ${value}` : ''}`);

      layer.addTo(this.choroplethLayer);
      bounds.extend(layer.getBounds());
    }

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { maxZoom: 16 });
    }
  }

  private colorForValue(value: number, min: number, max: number): string {
    const ratio = max === min ? 1 : (value - min) / (max - min);
    const [r1, g1, b1] = COLOR_LOW;
    const [r2, g2, b2] = COLOR_HIGH;
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    return `rgb(${r},${g},${b})`;
  }
}
