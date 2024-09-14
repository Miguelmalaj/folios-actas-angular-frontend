import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { UsuariosListComponent } from "./components/usuarios-list/usuarios-list.component";
import { UsuariosEditComponent } from "./components/usuarios-edit/usuarios-edit.component";

const routes: Routes = [
    {
        path: '',
        component: UsuariosListComponent,
    },
    {
        path: 'permisos/:id',
        component: UsuariosEditComponent,
    },
]

@NgModule({
    imports:[RouterModule.forChild(routes)],
    exports:[RouterModule]
})
export class PanelUsuariosRoutingModule{}