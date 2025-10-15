import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  constructor() { }

  login(user:number, password:string){
    return this.http.get(`http://localhost:3000/users?legajo=${user}&password=${password}`);
  }

  signup (firstName:string, lastName:string, password:string){
    return this.http.post("http://localhost:3000/users",{firstName,lastName,password});
  }
}
