import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(user:number, password:string){
    return  this.http.get("");
  }

  signup (name:string, lastname:string, password:string){
    return this.http.post("",{name,lastname,password});
  }
}
