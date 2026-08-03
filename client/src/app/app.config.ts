import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/services/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { providePrimeNG } from 'primeng/config';
import { EvPreset } from './core/theme/ev-preset';
import { PRIMENG_SR_LOCALE } from './core/theme/primeng-sr-locale';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { routes } from './app.routes';

export function httpTranslateLoaderFactory(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideIonicAngular({}),
    providePrimeNG({
      theme: { preset: EvPreset, options: { darkModeSelector: '.dark' } },
      translation: PRIMENG_SR_LOCALE
    }),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useFactory: httpTranslateLoaderFactory, deps: [HttpClient] },
        defaultLanguage: 'sr'
      })
    ),
    importProvidersFrom(AngularSvgIconModule.forRoot())
  ]
};
