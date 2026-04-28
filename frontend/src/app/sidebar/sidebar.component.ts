import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SidebarService } from '../services/sidebar.service';

import {
  LucideDynamicIcon,
  LucideHome,
  LucideFileText,
  LucideCalendarDays,
  LucideMessageSquare,
  LucideUsers,
  LucideBuilding2,
  LucideLogOut,
  LucideChevronLeft,
  LucideChevronRight,
  LucideMenu,
  LucideActivity,
  LucideUserCheck,
  LucideBuilding,          // ← NUEVO
} from '@lucide/angular';

interface NavItem {
  label: string;
  route: string;
  icon: any;
  platformOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LucideHome,
    LucideLogOut,
    LucideChevronLeft,
    LucideChevronRight,
    LucideMenu,
    LucideDynamicIcon,
    LucideActivity,
    LucideUserCheck,
    LucideBuilding,          // ← NUEVO
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {

  navItems: NavItem[] = [
    { label: 'Contratos',           route: '/contratos',           icon: LucideFileText },
    { label: 'Citas',               route: '/citas',               icon: LucideCalendarDays },
    { label: 'Propiedades',         route: '/propiedades',         icon: LucideBuilding },    // ← NUEVO
    { label: 'Propiedades activas', route: '/propiedades-activas', icon: LucideHome },
    { label: 'Propietarios',        route: '/propietarios',        icon: LucideUserCheck },
    { label: 'Chatbot',             route: '/chatbot',             icon: LucideMessageSquare },
  ];

  adminItems: NavItem[] = [
    { label: 'Usuarios',  route: '/administracion/usuarios',   icon: LucideUsers },
    { label: 'Compañías', route: '/administracion/companies',  icon: LucideBuilding2, platformOnly: true },
    { label: 'Logs',      route: '/administracion/logs',       icon: LucideActivity },
  ];

  showAdministration = false;
  isPlatformAdmin = false;

  private routerSub?: Subscription;
  private userSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    public sidebarService: SidebarService
  ) {}

  get isCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }

  get isMobileOpen(): boolean {
    return this.sidebarService.isMobileOpen();
  }

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

  toggleCollapse(): void {
    this.sidebarService.toggleCollapse();
  }

  openMobile(): void {
    this.sidebarService.openMobile();
  }

  closeMobile(): void {
    this.sidebarService.closeMobile();
  }

  onNavClick(): void {
    if (this.isMobileOpen) {
      this.sidebarService.closeMobile();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}