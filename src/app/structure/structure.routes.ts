import { RouterModule, Routes } from "@angular/router";

const routes:Routes=[
    {
        path: '',
        children: [
            {
                path: 'folios',
                loadChildren: () => import('./folios/folios.module').then( m => m.FoliosModule )
            }
        ]
    }
]

export const STRUCTURE_ROUTES=RouterModule.forChild(routes);