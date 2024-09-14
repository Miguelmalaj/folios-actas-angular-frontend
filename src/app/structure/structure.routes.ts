import { RouterModule, Routes } from "@angular/router";

const routes:Routes=[
    {
        path: '',
        children: [
            {
                path: 'folios',
                loadChildren: () => import('./folios/folios.module').then( m => m.FoliosModule )
            },
            {
                path: 'panel',
                loadChildren: () => import('./panel/panel-usuarios.module').then( m => m.PanelUsuariosModule )
            }
        ]
    },
    
]

export const STRUCTURE_ROUTES=RouterModule.forChild(routes);