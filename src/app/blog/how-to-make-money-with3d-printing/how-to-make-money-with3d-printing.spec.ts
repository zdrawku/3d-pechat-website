import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowToMakeMoneyWith3dPrinting } from './how-to-make-money-with3d-printing';

describe('HowToMakeMoneyWith3dPrinting', () => {
  let component: HowToMakeMoneyWith3dPrinting;
  let fixture: ComponentFixture<HowToMakeMoneyWith3dPrinting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowToMakeMoneyWith3dPrinting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HowToMakeMoneyWith3dPrinting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
