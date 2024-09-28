import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { WebSocketService } from '../services/auth/web-socket.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: [
    trigger('fade', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0, display: 'none' })),
      transition('in => out', [
        animate('300ms')
      ])
    ])
  ]
})
export class LoginComponent implements AfterViewInit, OnInit {

  errorMessage: string = '';
  showError = false;
  loginForm: FormGroup;
  submitted = false;
  isLoading: boolean = false;

  ngAfterViewInit() {}

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  ngOnInit(): void {
    // const savedToken = localStorage.getItem('token');
    const savedToken = localStorage.getItem('token');
    console.log('si hay token es este', savedToken);
    if (savedToken) {
      this.webSocketService.connect(savedToken);
    }
  }

  get form() {
    return {
      ...this.loginForm.value
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  async login() {
    this.submitted = true;

    if ( this.loginForm.valid ) {
      const { email, password } = this.form;

      this.authService.login(email, password).subscribe(
        token => {
          // console.log('Logged in with token:', token);
          this.webSocketService.disconnect(); // Disconnect any existing WebSocket connection
          this.webSocketService.connect(token); // Connect with the new token
          this.router.navigate(['/folios'])
        },
        error => {
          console.error('Login failed:', error);
          this.errorMessage = 'Invalid email or password!';
          this.showError = true;
          this.submitted = false;

          setTimeout(() => this.showError = false, 3000);
        }
      );

    }
  }
  

}
