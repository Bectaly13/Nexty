import { TestBed } from '@angular/core/testing';

import { VersionHandlerService } from './version-handler-service';

describe('VersionHandlerService', () => {
  let service: VersionHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VersionHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
