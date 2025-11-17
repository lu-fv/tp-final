import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaNotasComponent } from './carga-notas.component';

describe('CargaNotasComponent', () => {
  let component: CargaNotasComponent;
  let fixture: ComponentFixture<CargaNotasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaNotasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CargaNotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
