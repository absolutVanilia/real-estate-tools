import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Estado del sidebar
  private _isCollapsed = signal(false);
  private _isMobileOpen = signal(false);

  // Señales públicas de solo lectura
  readonly isCollapsed = this._isCollapsed.asReadonly();
  readonly isMobileOpen = this._isMobileOpen.asReadonly();

  toggleCollapse(): void {
    this._isCollapsed.update(v => !v);
  }

  setCollapsed(value: boolean): void {
    this._isCollapsed.set(value);
  }

  openMobile(): void {
    this._isMobileOpen.set(true);
  }

  closeMobile(): void {
    this._isMobileOpen.set(false);
  }
}