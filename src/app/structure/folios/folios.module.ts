import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoliosRoutingModule } from './folios-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FoliosComponent } from './components/main/folios.component';

@NgModule({
  declarations: [
    FoliosComponent
  ],
  imports: [
    CommonModule,
    FoliosRoutingModule,
    ReactiveFormsModule
  ]
})
export class FoliosModule { }
