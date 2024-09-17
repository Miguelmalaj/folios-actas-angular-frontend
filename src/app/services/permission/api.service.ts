import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserResponse } from '../../shared/interfaces/user-response.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000'; // Reemplaza con la URL real de tu API

  constructor( private http: HttpClient ) { }

  // Method to make the HTTP GET request and fetch non-admin users
  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>( `${this.apiUrl}/auth/users` );
  }

  // Method to update a user by ID
  updateUser(id: string, updatedUserData: Partial<UserResponse>): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/auth/users/${id}`, updatedUserData);
  }

}
