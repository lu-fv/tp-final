import { Component, OnDestroy, OnInit } from '@angular/core';
import { MenuServiceService } from '../menu.service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent implements OnInit, OnDestroy{

  private roleSub!: Subscription;

  userRole: 'user'|'admin' = 'user';

  menuStudent = [
    { label: 'Plan Académico', 
      route: '/plan-academico', 
      icon: 'school',
     },
    { label: 'Estado Académico', 
      route: '/estado-academico', 
      icon: 'grading',
     },
    {
      label: 'Inscripción a Cursada',
      route: '/inscripcion-cursada',
      icon: 'edit_calendar',
    },
    {
      label: 'Descarga Certificado',
      route: '/descarga-certificado',
      icon: 'download',
    },
    { label: 'Alerta de Pago', 
      route: '/alerta-pago', 
      icon: 'warning',
     },
  ];

  menuAdmin = [
    {
      label: 'Gestión de Estudiantes',
      icon: 'group',
      subMenu: [
        { label: 'Alta', route: '/admin/estudiantes/alta' },
        { label: 'Baja', route: '/admin/estudiantes/baja' },
        { label: 'Modificar Datos', route: '/admin/estudiantes/modificar' },
      ],
    },
    {
      label: 'Gestión de Materias',
      icon: 'menu_book',
      subMenu: [
        { label: 'Alta', route: '/admin/materias/alta' },
        { label: 'Baja', route: '/admin/materias/baja' },
        { label: 'Modificar Datos', route: '/admin/materias/modificar' },
      ],
    },
  ];

constructor(private service : MenuServiceService){}
  ngOnInit(){
    this.roleSub = this.service.role$.subscribe((role)=> {
      this.userRole = role;
    });
  }

  ngOnDestroy() {
      this.roleSub.unsubscribe();
  }
  ///Esto devuelve el menú correcto según el rol del usuario.
  get menuItems() {
    return this.userRole === 'admin' ? this.menuAdmin : this.menuStudent;
  }
}
