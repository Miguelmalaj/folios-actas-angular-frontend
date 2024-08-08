import { RouterModule, Routes } from "@angular/router";
import { FoliosComponent } from "./components/main/folios.component";
import { NgModule } from "@angular/core";

const routes: Routes = [
    {
        path: '',
        component: FoliosComponent,
    },
]

@NgModule({
    imports:[RouterModule.forChild(routes)],
    exports:[RouterModule]
})
export class FoliosRoutingModule{}