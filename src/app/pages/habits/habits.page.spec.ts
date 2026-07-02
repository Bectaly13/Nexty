import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HabitsPage } from './habits.page';

describe('HabitsPage', () => {
  let component: HabitsPage;
  let fixture: ComponentFixture<HabitsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitsPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
