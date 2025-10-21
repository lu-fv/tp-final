import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, RouterOutlet, NgIf],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent {
  constructor(private auth: AuthService) {}
  isAlumno() { return this.auth.rol() === 'alumno'; }
  isAdmin()  { return this.auth.rol() === 'admin'; }
  logout()   { this.auth.logout(); }
}
