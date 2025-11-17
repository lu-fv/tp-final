import { TestBed } from '@angular/core/testing';

import { CargaNotasService } from './carga-notas.service';

describe('CargaNotasService', () => {
  let service: CargaNotasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CargaNotasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
