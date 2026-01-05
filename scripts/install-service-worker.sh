#!/bin/bash

# Script to install and configure Angular Service Worker

echo "Installing @angular/service-worker..."
npm install @angular/service-worker --save

echo ""
echo "✅ Service Worker package installed!"
echo ""
echo "📝 Next steps:"
echo "1. Update src/app/app.config.ts to include provideServiceWorker"
echo "2. Add this to the providers array:"
echo ""
echo "   import { provideServiceWorker } from '@angular/service-worker';"
echo "   import { isDevMode } from '@angular/core';"
echo ""
echo "   // In the providers array:"
echo "   provideServiceWorker('ngsw-worker.js', {"
echo "     enabled: !isDevMode(),"
echo "     registrationStrategy: 'registerWhenStable:30000'"
echo "   })"
echo ""
echo "3. Build and deploy: npm run build"
echo ""
