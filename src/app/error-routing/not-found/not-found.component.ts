import { Component } from '@angular/core';

import { TranslatePipe } from '../../i18n/translate.pipe';

/** Unknown route — in the language of the URL (/en/… → English). */
@Component({
  template: `<h2>{{ 'misc.errors.notFound' | t }}</h2>`,
  standalone: true,
  imports: [TranslatePipe]
})
export class PageNotFoundComponent { }
