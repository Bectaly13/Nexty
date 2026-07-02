import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { VersionsPage } from './versions.page';

describe('VersionsPage', () => {
  let component: VersionsPage;
  let fixture: ComponentFixture<VersionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersionsPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VersionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
