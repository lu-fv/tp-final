import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule, MatButton } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { map } from 'rxjs';
import { MenuServiceService } from '../../menu.service.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatButton,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [AuthService],
})
export class LoginComponent {
  private formbuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private menuService = inject(MenuServiceService);
  loginForm = this.formbuilder.group({
    user: ['', [Validators.required, Validators.max(100000)]],
    password: [
      '',
      [Validators.required, Validators.minLength(4), Validators.maxLength(8)],
    ],
  });
  alert = signal<string | null>(null);
  constructor() {}
  get user() {
    return this.loginForm.get('user');
  }

  get password() {
    return this.loginForm.get('password');
  }
  /*submit(): void {
    console.log(this.loginForm);
    if (this.loginForm.invalid) return;
    this.authService
      .login(Number(this.user?.value), this.password?.value as string)
      .subscribe({
        next: (result: any) => {
          console.log(result);
          if (result.length > 0) {
            this.alert.set('Se encontro el usuario '+ result[0].firstName);
          } else {
            this.alert.set('Legajo o pass incorrecto');
          }
        },
        error: (err) => {
          console.error('Error:', err)
        this.alert.set('Ocurrio un error ');
        },
      });
  }*/

  submit(): void {
    if (this.loginForm.invalid) return;

    this.authService
      .login(Number(this.user?.value), this.password?.value as string)
      .subscribe({
        next: (result: any) => {
          if (result.length > 0) {
            const usuario = result[0];
            this.alert.set('Bienvenido ' + usuario.firstName);

            this.menuService.setRole(usuario.role);

            console.log('Rol asignado:', usuario.role);
          } else {
            this.alert.set('Legajo o contraseña incorrectos');
          }
        },
        error: (err) => {
          console.error('Error:', err);
          this.alert.set('Ocurrió un error al iniciar sesión');
        },
      });
  }
}
