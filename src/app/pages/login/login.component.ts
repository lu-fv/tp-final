import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [AuthService],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private menu = inject(MenuService);

  // Usuario: string (puede ser "alumno1", "admin", etc.)
  // Pass: minlength 4 por tu validación
  loginForm = this.fb.group({
    user: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
  });

  alert = signal<string | null>(null);

  get user() { return this.loginForm.get('user'); }
  get password() { return this.loginForm.get('password'); }

  submit(): void {
    if (this.loginForm.invalid) return;

    const username = String(this.user?.value ?? '').trim();
    const pass = String(this.password?.value ?? '').trim();

    this.auth.login(username, pass).subscribe({
      next: (result: any) => {
        // json-server puede devolver array o objeto
        const u = Array.isArray(result) ? result[0] : result;

        if (u) {
          // Nombre robusto: toma lo que exista en tu db.json
          const nombre =
            u.nombre ??
            u.firstName ??
            u.username ??
            u.legajo ??
            'Usuario';

          // Rol robusto: si no viene, deduzco por studentId
          const rol: 'alumno' | 'admin' =
            u.role ??
            (u.studentId ? 'alumno' : 'admin');

          // Notifico el rol al menú (para mostrar opciones)
          this.menu.setRole(rol);

          this.alert.set(`Bienvenido ${nombre}`);
          // acá podrías navegar si querés: this.router.navigateByUrl('/deuda') ...
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
