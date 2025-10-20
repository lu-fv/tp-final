import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuServiceService {
  private roleSubjet = new BehaviorSubject<'user' | 'admin'>('user');
  role$ = this.roleSubjet.asObservable();

  setRole(newRole: 'user' | 'admin') {
    this.roleSubjet.next(newRole);
  }
  getRole(): 'user' | 'admin' {
    return this.roleSubjet.value;
  }
}
