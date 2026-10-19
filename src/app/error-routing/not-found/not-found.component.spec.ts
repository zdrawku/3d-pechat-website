import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { I18nService } from '../../i18n/i18n.service';
import bgMisc from '../../../i18n/bg/misc.json';
import enMisc from '../../../i18n/en/misc.json';
import { PageNotFoundComponent } from './not-found.component';

describe('PageNotFoundComponent', () => {
  afterEach(() => TestBed.inject(DOCUMENT).documentElement.setAttribute('lang', 'bg'));

  it('says "page not found" in the URL’s language (/en/… → English)', async () => {
    const fixture = TestBed.createComponent(PageNotFoundComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe(bgMisc.errors.notFound);

    await TestBed.inject(I18nService).use('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe(enMisc.errors.notFound);
  });
});
