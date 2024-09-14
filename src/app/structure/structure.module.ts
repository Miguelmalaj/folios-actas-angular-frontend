import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoliosModule } from './folios/folios.module';
import { STRUCTURE_ROUTES } from './structure.routes';
import { PanelUsuariosModule } from './panel/panel-usuarios.module';



@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    PanelUsuariosModule,
    FoliosModule,
    STRUCTURE_ROUTES,
  ]
})
export class StructureModule { }
