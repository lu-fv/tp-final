import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioCursadaComponent } from './formulario-cursada.component';

describe('FormularioCursadaComponent', () => {
  let component: FormularioCursadaComponent;
  let fixture: ComponentFixture<FormularioCursadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioCursadaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormularioCursadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
