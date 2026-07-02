import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressChartComponent } from './progress-chart.component';

describe('ProgressChartComponent', () => {
  let component: ProgressChartComponent;
  let fixture: ComponentFixture<ProgressChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressChartComponent);
    fixture.componentRef.setInput("data", []);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
