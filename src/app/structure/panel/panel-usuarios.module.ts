import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UsuariosEditComponent } from './components/usuarios-edit/usuarios-edit.component';
import { UsuariosListComponent } from './components/usuarios-list/usuarios-list.component';
import { PanelUsuariosRoutingModule } from './panel-usuarios-routing.module';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    UsuariosListComponent,
    UsuariosEditComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    PanelUsuariosRoutingModule,
    ReactiveFormsModule
  ]
})
export class PanelUsuariosModule { }
