import { ApplicationConfig, ErrorHandler, Provider } from '@angular/core';
import { provideRouter, withInMemoryScrolling, UrlSerializer } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
// Uncomment after installing @angular/service-worker
// import { provideServiceWorker } from '@angular/service-worker';
// import { isDevMode } from '@angular/core';

import { routes } from './app.routes';
import { GlobalErrorHandlerService } from './error-routing/error/global-error-handler.service';
import { environment } from '../environments/environment';
import { provideMarkdown } from 'ngx-markdown';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TrailingSlashUrlSerializer } from './trailing-slash-url-serializer';

const providers: Provider = [
  provideRouter(routes, withInMemoryScrolling({
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled'
  })),
  { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer },
  provideClientHydration(withEventReplay()),
  provideHttpClient(withFetch()),
  provideMarkdown(),
  provideAnimations(),
  // Uncomment after installing @angular/service-worker with: npm install @angular/service-worker --save
  // provideServiceWorker('ngsw-worker.js', {
  //   enabled: !isDevMode(),
  //   registrationStrategy: 'registerWhenStable:30000'
  // })
];

if (environment.production) {
  providers.push({
    provide: ErrorHandler,
    useClass: GlobalErrorHandlerService
  });
}

export const appConfig: ApplicationConfig = { providers };
