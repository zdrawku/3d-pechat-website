import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { I18nService } from '../../i18n/i18n.service';
import bgMisc from '../../../i18n/bg/misc.json';
import enMisc from '../../../i18n/en/misc.json';
import { UncaughtErrorComponent } from './uncaught-error.component';

describe('UncaughtErrorComponent', () => {
  afterEach(() => TestBed.inject(DOCUMENT).documentElement.setAttribute('lang', 'bg'));

  it('reports the error in the page’s language', async () => {
    const fixture = TestBed.createComponent(UncaughtErrorComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe(bgMisc.errors.serverError);

    await TestBed.inject(I18nService).use('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe(enMisc.errors.serverError);
  });
});
