import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoliosRoutingModule } from './folios-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FoliosComponent } from './components/main/folios.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    FoliosComponent
  ],
  imports: [
    CommonModule,
    FoliosRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ]
})
export class FoliosModule { }
