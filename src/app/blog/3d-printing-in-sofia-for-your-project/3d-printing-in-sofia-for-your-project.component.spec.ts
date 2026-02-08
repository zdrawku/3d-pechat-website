import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeDPrintingInSofiaForYourProjectComponent } from './3d-printing-in-sofia-for-your-project.component';

describe('ThreeDPrintingInSofiaForYourProjectComponent', () => {
  let component: ThreeDPrintingInSofiaForYourProjectComponent;
  let fixture: ComponentFixture<ThreeDPrintingInSofiaForYourProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreeDPrintingInSofiaForYourProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreeDPrintingInSofiaForYourProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
