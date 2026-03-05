import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThreeDPrintingTechnologiesComponent } from './3d-printing-technologies.component';

describe('ThreeDPrintingTechnologiesComponent', () => {
  let component: ThreeDPrintingTechnologiesComponent;
  let fixture: ComponentFixture<ThreeDPrintingTechnologiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreeDPrintingTechnologiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreeDPrintingTechnologiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
