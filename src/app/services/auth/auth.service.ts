import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token: string | null = null;
  private isAdmin: boolean = false;
  private folio: boolean = false;
  private reverso: boolean = false;
  private reversoFolio: boolean = false;
  private marco: boolean = false;
  private marcoFolioReverso: boolean = false;
  private marcoReverso: boolean = false;
  // private apiUrl = 'https://base-api-divine-morning-3669.fly.dev/auth/login'; // Reemplaza con la URL real de tu API
  private apiUrl = 'http://localhost:3000/auth/login'; // Reemplaza con la URL real de tu API

  constructor(private http: HttpClient) { 
    // console.log('constructor authService')
  }

  login(username: string, password: string): Observable<string> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { username, password };

    return this.http.post<{ accessToken: string, folio: boolean, reverso: boolean, reversoFolio: boolean, marco: boolean, marcoFolioReverso: boolean, marcoReverso: boolean, isAdmin: boolean }>(this.apiUrl, body, { headers })
      .pipe(
        map(response => {
          this.folio = response.folio;
          this.reverso = response.reverso;
          this.reversoFolio = response.reversoFolio;
          this.marco = response.marco;
          this.marcoFolioReverso = response.marcoFolioReverso;
          this.marcoReverso = response.marcoReverso;
          this.isAdmin = response.isAdmin;
          this.token = response.accessToken;
          return this.token;
        })
      );
  }

  getToken(): string | null {
    return this.token;
  }

  isUserAdmin(): boolean {
    return this.isAdmin;
  }
  
  hasUserFolio(): boolean {
    return this.folio;
  }
  
  hasUserReverso(): boolean {
    return this.reverso;
  }
  
  hasUserReversoFolio(): boolean {
    return this.reversoFolio;
  }
  
  hasUserMarco(): boolean {
    return this.marco;
  }
  
  hasUserMarcoFolioReverso(): boolean {
    return this.marcoFolioReverso;
  }
  
  hasUserMarcoReverso(): boolean {
    return this.marcoReverso;
  }

  logout(): void {
    this.token = null;
    this.folio = false;
    this.reverso = false;
    this.reversoFolio = false;
    this.marco = false;
    this.marcoFolioReverso = false;
    this.marcoReverso = false;
    this.isAdmin = false;
  }

}
