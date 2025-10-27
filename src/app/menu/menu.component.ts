import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Usa los nombres reales del servicio core
  isLoggedIn() { return this.auth.isLogged(); }
  role()       { return this.auth.role(); }

  isAdmin()  { return this.role() === 'admin'; }
  isAlumno() { return this.role() === 'alumno'; }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
