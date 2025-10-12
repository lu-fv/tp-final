import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  constructor() { }

  login(user:number, password:string){
    return  this.http.get("");
  }

  signup (name:string, lastname:string, password:string){
    return this.http.post("",{name,lastname,password});
  }
}
