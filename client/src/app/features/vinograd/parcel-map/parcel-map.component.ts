import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import * as L from 'leaflet';
import 'leaflet-draw';

interface ParcelRow {
  id: string;
  name: string;
  geo_boundary?: any;
}

const SERBIA_CENTER: L.LatLngExpression = [44.0, 20.9];

@Component({
  selector: 'app-parcel-map',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SelectModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './parcel-map.component.html',
  styleUrl: './parcel-map.component.scss'
})
export class ParcelMapComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  private messages = inject(MessageService);

  parcels: ParcelRow[] = [];
  selectedParcelId: string | null = null;

  ndviDateFrom: string;
  ndviDateTo: string;
  ndviLoading = false;
  ndviVisible = false;

  private map!: L.Map;
  private drawnItems!: L.FeatureGroup;
  private drawControl!: L.Control.Draw;
  private otherParcelsLayer!: L.LayerGroup;
  private ndviOverlay: L.ImageOverlay | null = null;
  private ndviObjectUrl: string | null = null;

  constructor() {
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.ndviDateTo = today.toISOString().slice(0, 10);
    this.ndviDateFrom = monthAgo.toISOString().slice(0, 10);
  }

  ngOnInit(): void {
    this.loadParcels();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  onParcelChange(): void {
    this.drawnItems.clearLayers();
    this.hideNdvi();

    const parcel = this.parcels.find((p) => p.id === this.selectedParcelId);
    if (parcel?.geo_boundary) {
      L.geoJSON(parcel.geo_boundary).eachLayer((layer) => this.drawnItems.addLayer(layer));
      const bounds = this.drawnItems.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { maxZoom: 17 });
      }
    }

    this.renderOtherParcels();
  }

  get hasBoundary(): boolean {
    return !!this.selectedParcelId && this.drawnItems?.getLayers().length > 0;
  }

  showNdvi(): void {
    if (!this.selectedParcelId || !this.hasBoundary) return;

    this.ndviLoading = true;
    this.http
      .get(`/api/admin/vineyard-parcels/${this.selectedParcelId}/ndvi`, {
        params: { from: this.ndviDateFrom, to: this.ndviDateTo },
        responseType: 'blob'
      })
      .subscribe({
        next: (blob) => {
          this.hideNdvi();
          this.ndviObjectUrl = URL.createObjectURL(blob);
          const bounds = this.drawnItems.getBounds();
          this.ndviOverlay = L.imageOverlay(this.ndviObjectUrl, bounds, { opacity: 0.75 }).addTo(this.map);
          this.ndviVisible = true;
          this.ndviLoading = false;
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.translate.instant('ndvi.loadError') });
          this.ndviLoading = false;
        }
      });
  }

  hideNdvi(): void {
    if (this.ndviOverlay) {
      this.map.removeLayer(this.ndviOverlay);
      this.ndviOverlay = null;
    }
    if (this.ndviObjectUrl) {
      URL.revokeObjectURL(this.ndviObjectUrl);
      this.ndviObjectUrl = null;
    }
    this.ndviVisible = false;
  }

  saveBoundary(): void {
    if (!this.selectedParcelId) return;
    if (this.drawnItems.getLayers().length === 0) {
      this.messages.add({ severity: 'warn', summary: this.translate.instant('parcelMap.noShape') });
      return;
    }

    const geojson: any = this.drawnItems.toGeoJSON();
    const boundary = geojson.features?.[0]?.geometry ?? geojson;

    this.http.post(`/api/admin/vineyard-parcels/${this.selectedParcelId}/geo-boundary`, { geo_boundary: boundary }).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.translate.instant('general.saved') });
        const parcel = this.parcels.find((p) => p.id === this.selectedParcelId);
        if (parcel) {
          parcel.geo_boundary = boundary;
        }
        this.renderOtherParcels();
      },
      error: () => {
        this.messages.add({ severity: 'error', summary: this.translate.instant('general.saveError') });
      }
    });
  }

  clearBoundary(): void {
    this.drawnItems.clearLayers();
    this.hideNdvi();
  }

  private loadParcels(): void {
    this.http.get<ParcelRow[]>('/api/admin/vineyard-parcels').subscribe((rows) => {
      this.parcels = rows;
      this.renderOtherParcels();
    });
  }

  private initMap(): void {
    this.map = L.map('parcel-map').setView(SERBIA_CENTER, 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.otherParcelsLayer = L.layerGroup().addTo(this.map);

    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    this.drawControl = new L.Control.Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false
      },
      edit: { featureGroup: this.drawnItems }
    });
    this.map.addControl(this.drawControl);

    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      this.drawnItems.clearLayers();
      this.drawnItems.addLayer(e.layer);
    });

    this.renderOtherParcels();
  }

  private renderOtherParcels(): void {
    if (!this.otherParcelsLayer) return;
    this.otherParcelsLayer.clearLayers();

    for (const parcel of this.parcels) {
      if (!parcel.geo_boundary || parcel.id === this.selectedParcelId) continue;
      L.geoJSON(parcel.geo_boundary, {
        style: { color: '#7d1f36', weight: 2, fillOpacity: 0.1 }
      })
        .bindTooltip(parcel.name)
        .addTo(this.otherParcelsLayer);
    }
  }
}
