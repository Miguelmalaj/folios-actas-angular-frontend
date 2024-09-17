import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../services/permission/api.service';

@Component({
  selector: 'app-usuarios-edit',
  templateUrl: './usuarios-edit.component.html',
  styleUrl: './usuarios-edit.component.css'
})
export class UsuariosEditComponent implements OnInit {

  //formulario
  form!: FormGroup;
  id!: string;
  username!: string;

  constructor( 
    private router: Router, 
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.id = id.split('|')[0];
    this.username = id.split('|')[1];
    this.initializeForm();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      _id: [this.id],
      username: [this.username],
      folio: [false],
      reverso: [false],
      reversoFolio: [false],
      marco: [false],
      marcoFolioReverso: [false],
      marcoReverso: [false],
    })
  }

  redirectUsuarios(){
    this.router.navigate(['/panel'])
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
      // Handle form submission logic here
      const updatedUserData = this.form.value;
    
    // Call updateUser from ApiService
    this.apiService.updateUser(this.id, updatedUserData).subscribe(
      (response: any) => {
        console.log('User updated successfully:', response);
        this.router.navigate(['/panel'])
      },
      (error) => {
        console.error('Error updating user:', error);
      }
    );
    }
  }
}
