import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoliosModule } from './folios/folios.module';
import { STRUCTURE_ROUTES } from './structure.routes';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FoliosModule,
    STRUCTURE_ROUTES,
  ]
})
export class StructureModule { }
