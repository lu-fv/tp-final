import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioExamenComponent } from './formulario-examen.component';

describe('FormularioExamenComponent', () => {
  let component: FormularioExamenComponent;
  let fixture: ComponentFixture<FormularioExamenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioExamenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormularioExamenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
