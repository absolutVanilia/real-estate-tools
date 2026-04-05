import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  navItems = [
    { label: 'Contratos', route: '/contratos' },
    { label: 'Citas', route: '/citas' },
    { label: 'Propiedades activas', route: '/propiedades-activas' },
    { label: 'Chatbot', route: '/chatbot' }
  ];

  adminItems: { label: string; route: string; platformOnly?: boolean }[] = [
    { label: 'Usuarios', route: '/administracion/usuarios' },
    { label: 'Compañías', route: '/administracion/companies', platformOnly: true }
  ];

  showAdministration = false;
  isPlatformAdmin = false;

  private routerSub?: Subscription;
  private userSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshNavState();
    this.userSub = this.authService.currentUser$.subscribe(() => this.refreshNavState());
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.refreshNavState());
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  private refreshNavState(): void {
    this.authService.refreshUserFromStorage();
    this.showAdministration = this.authService.canSeeAdministration();
    this.isPlatformAdmin = this.authService.isPlatformAdmin();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
