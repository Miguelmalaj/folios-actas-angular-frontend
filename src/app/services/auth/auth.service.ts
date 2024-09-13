import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token: string | null = null;
  folio: boolean = false;
  reverso: boolean = false;
  reversoFolio: boolean = false;
  marco: boolean = false;
  marcoFolioReverso: boolean = false;
  marcoReverso: boolean = false;
  // private apiUrl = 'https://base-api-divine-morning-3669.fly.dev/auth/login'; // Reemplaza con la URL real de tu API
  private apiUrl = 'http://localhost:3000/auth/login'; // Reemplaza con la URL real de tu API

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<string> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { username, password };

    return this.http.post<{ accessToken: string, folio: boolean, reverso: boolean, reversoFolio: boolean, marco: boolean, marcoFolioReverso: boolean, marcoReverso: boolean }>(this.apiUrl, body, { headers })
      .pipe(
        map(response => {
          this.folio = response.folio;
          this.reverso = response.reverso;
          this.reversoFolio = response.reversoFolio;
          this.marco = response.marco;
          this.marcoFolioReverso = response.marcoFolioReverso;
          this.marcoReverso = response.marcoReverso;
          this.token = response.accessToken;
          return this.token;
        })
      );
  }

  getToken(): string | null {
    return this.token;
  }

  logout(): void {
    this.token = null;
  }

}
