import { Component, inject, signal, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { StudentApiService } from '../../../services/student-api.service';
import { Student } from '../../../core/models'; 

@Component({
  selector: 'menu-alumno',
  standalone: true,
  imports: [NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './menu-alumno.component.html',
  styleUrls: ['./menu-alumno.component.css'],
})
export class MenuAlumnoComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private studentApi = inject(StudentApiService);

  private _alumno = signal<Student | null>(null);

  ngOnInit(): void {
    const sid = this.auth.user()?.studentId;
    if (sid) {
      this.studentApi.getById(sid).subscribe(a => this._alumno.set(a));
    }
  }

  alumno(): Student | null { return this._alumno(); }
  username(): string { return this.auth.user()?.username ?? ''; }

  role(): string | null { return this.auth.role(); }
  isAdmin(): boolean { return this.role() === 'admin'; }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
