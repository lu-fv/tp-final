import { Component, inject, signal, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { AdminApiService } from '../../../services/admin-api.service';
import { Admin } from '../../../core/models'; // 👈 unificado a ../../core/models

@Component({
  selector: 'menu-admin',
  standalone: true,
  imports: [NgIf, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './menu-admin.component.html',
  styleUrls: ['./menu-admin.component.css'],
})
export class MenuAdminComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private adminApi = inject(AdminApiService);

  private _admin = signal<Admin | null>(null);

  ngOnInit(): void {
    const aid = this.auth.user()?.id;
    if (aid) {
      this.adminApi.getById(aid).subscribe(a => this._admin.set(a));
    }
  }

  admin(): Admin | null { return this._admin(); }
  username(): string { return this.auth.user()?.username ?? ''; }

  role(): string | null { return this.auth.role(); }
  isAdmin(): boolean { return this.role() === 'admin'; }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
