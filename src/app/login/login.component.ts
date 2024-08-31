import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
export class LoginComponent implements AfterViewInit {

  errorMessage: string = '';
  showError = false;
  loginForm: FormGroup;
  submitted = false;
  isLoading: boolean = false;

  ngAfterViewInit() {}

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
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
      try {

      const { email, password } = this.form;

      if (email === 'usuario' && password === 'prueba') {
        // Credentials are valid, proceed with the login process
        console.log('Login successful!');
        // You can navigate to another page or perform other actions here
        // this.router.navigate(['/dashboard'])
        this.router.navigate(['/folios'])

      } else {
        // Invalid credentials
        this.errorMessage = 'Invalid email or password!';
        this.showError = true;

        // Hide the error message after 3 seconds
        setTimeout(() => this.showError = false, 3000);
      }
        
      } catch ( error: any ) {
        // Check the type of error based on the statusText property
        if (error?.statusText === 'Internal Server Error') {
          this.errorMessage = 'Server error!';
        } else if (error?.statusText === 'Unauthorized') {
          this.errorMessage = 'Unauthorized access!';
        } else {
          // Handle generic or unknown errors
          this.errorMessage = 'Unknown login error. Please try again later.';
        }

        // Display the error toast
        this.showError = true;
        // Hide the error toast after 3 seconds
        setTimeout(() => this.showError = false, 3000);
        
      } finally {

      }
    }
  }

}
