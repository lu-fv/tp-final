import { Component, inject } from '@angular/core';
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
import {MatButtonModule, MatButton} from '@angular/material/button';

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
})
export class LoginComponent {
  private formbuilder = inject(FormBuilder);
  loginForm = this.formbuilder.group({
    user: ['', [Validators.required, Validators.max(5)]],
    password: [
      '',
      [Validators.required, Validators.minLength(4), Validators.maxLength(8)],
    ],
  });
  constructor() {}
  get user(){
    return this.loginForm.get("user")
  }

  get password(){
    return this.loginForm.get("password")
  }
  submit(): void {
    console.log(this.loginForm)
    if (this.loginForm.invalid)
      return;
  }
}
