import { Component } from '@angular/core';

import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  standalone: true,
  template: `<h2>{{ 'misc.errors.serverError' | t }}</h2>`,
  imports: [TranslatePipe]
})
export class UncaughtErrorComponent  { }
