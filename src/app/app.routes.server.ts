import { RenderMode, ServerRoute } from '@angular/ssr';

// Every concrete route discovered in app.routes.ts is prerendered to a
// static HTML file at build time (outputMode: "static" in angular.json).
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
