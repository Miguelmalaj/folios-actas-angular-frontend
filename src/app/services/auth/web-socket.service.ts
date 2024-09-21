import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private apiUrl = environment.apiUrl;
  
  constructor(
    private authService: AuthService,
    private router: Router,
  ) { 
    // Automatically reconnect on page load
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      this.connect(savedToken);
    }

  }

  connect(token: string) {
    // this.socket = io('https://base-api-divine-morning-3669.fly.dev', {
    localStorage.setItem('token', token);  // Store the token in local storage

    // this.socket = io('http://localhost:3000', {
    this.socket = io(this.apiUrl, {
      query: {
        token: token,
      },
      transports: ['websocket'], // Asegúrate de que WebSocket esté habilitado
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
        // alert('La conexión con el servidor se ha perdido. La página se recargará.');
        // location.reload();
        localStorage.removeItem('token');  // Remove token from local storage when disconnected
        this.router.navigate(['/login']);

        //TODO: si se recarga la pagina se desconecta el socket...
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      /* localStorage.removeItem('token');  // Remove token from local storage when disconnected
      this.router.navigate(['/login']); */
      console.log('WebSocket connection closed.');
    }
  }

}
