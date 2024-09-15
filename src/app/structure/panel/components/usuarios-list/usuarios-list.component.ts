import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../services/permission/api.service';
import { UserResponse } from '../../../../shared/interfaces/user-response.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios-list',
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css'
})
export class UsuariosListComponent implements OnInit {

  users: UserResponse[] = []; // Property to store the user list
  
  constructor( private apiService: ApiService, private router: Router ) {

  }

  ngOnInit(): void {
    this.apiService.getUsers().subscribe((response: UserResponse[]) => {
      const usersList: UserResponse[] = response; // Store the result in a constant with its type
      this.users = usersList; // Assign the constant to the class property

      console.log('response', this.users)
    });
  }

  redirectFolios() {
    this.router.navigate(['/folios'])
  }

}
