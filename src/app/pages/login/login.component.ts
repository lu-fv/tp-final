import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { AuthService as CoreAuthService } from '../../core/auth.service';
import type { Rol } from '../../core/models';
import { Router } from '@angular/router';

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
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authCore = inject(CoreAuthService);
  private router = inject(Router);

  // Ahora el rol puede ser alumno / admin / profesor
  role = new FormControl<Rol>('alumno', { nonNullable: true });

  loginForm = this.fb.group({
    user: ['', [Validators.required, Validators.maxLength(100)]],
    password: [
      '',
      [Validators.required, Validators.minLength(4), Validators.maxLength(20)],
    ],
  });

  private _hide = signal(true);
  hide() {
    return this._hide();
  }
  togglePass() {
    this._hide.set(!this._hide());
  }

  alert = signal<string | null>(null);

  get user() {
    return this.loginForm.get('user');
  }
  get password() {
    return this.loginForm.get('password');
  }

  submit(): void {
    if (this.loginForm.invalid) return;

    const username = String(this.user?.value ?? '').trim();
    const pass = String(this.password?.value ?? '').trim();
    const selectedRole = this.role.value;

    this.authCore
      .login(username, pass)
      .then((ok) => {
        if (!ok) {
          this.alert.set('Usuario o contraseña incorrectos');
          return;
        }

        const realRole = this.authCore.role();

        // Si el usuario seleccionó un rol que no le corresponde
        if (realRole !== selectedRole) {
          this.authCore.logout();
          this.alert.set('El rol seleccionado no coincide con el usuario');
          return;
        }

        // Redirecciones correctas por rol
        if (realRole === 'admin') {
          this.router.navigateByUrl('dashboard/admin');
        } else if (realRole === 'alumno') {
          this.router.navigateByUrl('dashboard/student');
        } else if (realRole === 'profesor') {
          this.router.navigateByUrl('dashboard/profesor');
        }
      })
      .catch(() => {
        this.alert.set('Ocurrió un error al iniciar sesión');
      });
  }
}
