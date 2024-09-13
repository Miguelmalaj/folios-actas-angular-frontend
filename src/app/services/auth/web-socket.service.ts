import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  
  constructor(private authService: AuthService) { }

  connect(token: string) {
    // this.socket = io('https://base-api-divine-morning-3669.fly.dev', {
    this.socket = io('http://localhost:3000', {
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

        //TODO: si se recarga la pagina se desconecta el socket...
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log('WebSocket connection closed.');
    }
  }

}
