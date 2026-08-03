import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface Slide {
  icon: string;
  titleKey: string;
  textKey: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslateModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit, OnDestroy {
  slides: Slide[] = [
    { icon: 'pi pi-sitemap', titleKey: 'auth.slide1.title', textKey: 'auth.slide1.text' },
    { icon: 'pi pi-map', titleKey: 'auth.slide2.title', textKey: 'auth.slide2.text' },
    { icon: 'pi pi-chart-line', titleKey: 'auth.slide3.title', textKey: 'auth.slide3.text' }
  ];

  activeSlide = 0;
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  start(): void {
    this.intervalId = setInterval(() => this.next(), 6000);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  next(): void {
    this.activeSlide = (this.activeSlide + 1) % this.slides.length;
  }

  goTo(index: number): void {
    this.activeSlide = index;
  }
}
