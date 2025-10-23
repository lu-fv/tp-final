import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// Servicios / modelos
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import type { Rol } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [AuthService],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private menuService = inject(MenuService);

  // toggle de rol (fuera del form)
  role = new FormControl<Rol>('alumno', { nonNullable: true });

  // form de credenciales
  loginForm = this.fb.group({
    user: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
  });

  // UI
  private _hide = signal(true);
  hide() { return this._hide(); }
  togglePass() { this._hide.set(!this._hide()); }

  alert = signal<string | null>(null);
  get user() { return this.loginForm.get('user'); }
  get password() { return this.loginForm.get('password'); }

  submit(): void {
    if (this.loginForm.invalid) return;

    const username = String(this.user?.value ?? '').trim();
    const pass = String(this.password?.value ?? '').trim();
    const rolSel = this.role.value;

    this.auth.login(username, pass).subscribe({
      next: (result: any) => {
        const u = Array.isArray(result) ? result[0] : result;

        if (u) {
          // nombre robusto
          const nombre =
            (u.nombre && String(u.nombre).trim()) ??
            (u.firstName && String(u.firstName).trim()) ??
            (u.username && String(u.username).trim()) ??
            (u.legajo ? `Legajo ${u.legajo}` : 'Usuario');

          // rol: si viene en el usuario lo usamos, sino el seleccionado
          const rol: Rol = (u.role as Rol) ?? (u.studentId ? 'alumno' : 'admin') ?? (rolSel ?? 'alumno');

          // exponer al menú
          this.menuService.setRole(rol);

          this.alert.set(`Bienvenido ${nombre}`);
        } else {
          this.alert.set('Usuario o contraseña incorrectos');
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.alert.set('Ocurrió un error al iniciar sesión');
      },
    });
  }
}
