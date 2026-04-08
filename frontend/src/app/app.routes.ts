import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { ContratosComponent } from './pages/contratos/contratos.component';
import { CitasComponent } from './pages/citas/citas.component';
import { PropiedadesActivasComponent } from './pages/propiedades-activas/propiedades-activas.component';
import { PropietariosComponent } from './pages/propietarios/propietarios.component';  // ← NUEVO
import { ChatbotComponent } from './pages/chatbot/chatbot';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { CompaniesComponent } from './pages/companies/companies.component';
import { LogsComponent } from './pages/admin-logs/logs.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard, loginPageGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginPageGuard] },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'contratos', pathMatch: 'full' },
      { path: 'contratos', component: ContratosComponent },
      { path: 'citas', component: CitasComponent },
      { path: 'propiedades-activas', component: PropiedadesActivasComponent },
      { path: 'propietarios', component: PropietariosComponent },           // ← NUEVO
      { path: 'chatbot', component: ChatbotComponent },
      { path: 'usuarios', redirectTo: 'administracion/usuarios', pathMatch: 'full' },
      { path: 'administracion/usuarios', component: UsuariosComponent },
      { path: 'administracion/companies', component: CompaniesComponent },
      { path: 'administracion/logs', component: LogsComponent },
      { path: '**', redirectTo: 'contratos' },
    ],
  },
];