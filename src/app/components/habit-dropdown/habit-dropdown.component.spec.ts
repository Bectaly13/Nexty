import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitDropdownComponent } from './habit-dropdown.component';

describe('HabitDropdownComponent', () => {
  let component: HabitDropdownComponent;
  let fixture: ComponentFixture<HabitDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitDropdownComponent);
    fixture.componentRef.setInput("habits", []);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
