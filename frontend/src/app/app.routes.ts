import { Routes } from '@angular/router';
import { ContratosComponent } from './pages/contratos/contratos.component';
import { CitasComponent } from './pages/citas/citas.component';
import { PropiedadesActivasComponent } from './pages/propiedades-activas/propiedades-activas.component';

export const routes: Routes = [
  { path: '', redirectTo: '/contratos', pathMatch: 'full' },
  { path: 'contratos', component: ContratosComponent },
  { path: 'citas', component: CitasComponent },
  { path: 'propiedades-activas', component: PropiedadesActivasComponent },
];
