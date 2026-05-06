import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuditLogsService,
  AuditLog,
  AuditLogFilters,
} from '../../services/audit-logs.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/components/toast';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

import {
  LucideActivity,
  LucideSearch,
  LucideFilter,
  LucideChevronDown,
  LucideChevronUp,
  LucideChevronLeft,
  LucideChevronRight,
  LucidePlus,
  LucidePencil,
  LucideTrash2,
  LucideLogIn,
  LucideLogOut,
  LucideUser,
  LucideBuilding2,
  LucideCalendarDays,
  LucideTag,
  LucideClock,
  LucideX,
  LucideGlobe,
  LucideShieldAlert,
  LucideInfo,
  LucideArrowRightLeft,
  LucideRefreshCw,
  LucideFileText,
  LucideHash,
  LucideMonitor,
} from '@lucide/angular';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    LoadingStateComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    CommonModule,
    FormsModule,
    LucideActivity,
    LucideSearch,
    LucideFilter,
    LucideChevronDown,
    LucideChevronUp,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideLogIn,
    LucideLogOut,
    LucideUser,
    LucideBuilding2,
    LucideCalendarDays,
    LucideTag,
    LucideClock,
    LucideX,
    LucideGlobe,
    LucideShieldAlert,
    LucideInfo,
    LucideArrowRightLeft,
    LucideRefreshCw,
    LucideFileText,
    LucideHash,
    LucideMonitor,
  ],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss',
})
export class LogsComponent implements OnInit {
  // ─── Services ───
  private auditLogsService = inject(AuditLogsService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  // ─── State ───
  logs = signal<AuditLog[]>([]);
  totalCount = signal(0);
  isLoading = signal(false);
  expandedLogId = signal<number | null>(null);
  showFilters = signal(false);

  // ─── Filter options (from API) ───
  availableActions = signal<string[]>([]);
  availableResourceTypes = signal<string[]>([]);

  // ─── Filter values ───
  searchTerm = signal('');
  filterAction = signal('');
  filterResourceType = signal('');
  filterDateFrom = signal('');
  filterDateTo = signal('');
  currentPage = signal(1);
  pageSize = signal(25);

  // ─── Auth state ───
  isPlatformAdmin = signal(false);
  hasAccess = signal(false);

  // ─── Computed ───
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPrevPage = computed(() => this.currentPage() > 1);

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.filterAction()) count++;
    if (this.filterResourceType()) count++;
    if (this.filterDateFrom()) count++;
    if (this.filterDateTo()) count++;
    return count;
  });

  // ─── Search debounce ───
  private searchTimeout: any;

  ngOnInit(): void {
    this.authService.refreshUserFromStorage();
    const user = this.authService.getCurrentUser();
    this.isPlatformAdmin.set(this.authService.isPlatformAdmin());
    this.hasAccess.set(
      !!user && (user.is_platform_admin || user.role === 'admin')
    );

    if (this.hasAccess()) {
      this.loadLogs();
    }
  }

  // ─── Data ───
  loadLogs(): void {
    this.isLoading.set(true);

    const filters: AuditLogFilters = {
      page: this.currentPage(),
      page_size: this.pageSize(),
    };

    if (this.searchTerm().trim()) filters.search = this.searchTerm().trim();
    if (this.filterAction()) filters.action = this.filterAction();
    if (this.filterResourceType())
      filters.resource_type = this.filterResourceType();
    if (this.filterDateFrom()) filters.date_from = this.filterDateFrom();
    if (this.filterDateTo()) filters.date_to = this.filterDateTo();

    this.auditLogsService.list(filters).subscribe({
      next: (res) => {
        this.logs.set(res.results);
        this.totalCount.set(res.count);
        if (res.filter_options) {
          this.availableActions.set(res.filter_options.actions || []);
          this.availableResourceTypes.set(
            res.filter_options.resource_types || []
          );
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los logs.');
        this.isLoading.set(false);
      },
    });
  }

  // ─── Search ───
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadLogs();
    }, 400);
  }

  // ─── Filters ───
  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  clearFilters(): void {
    this.filterAction.set('');
    this.filterResourceType.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadLogs();
  }

  onFilterActionChange(value: string): void {
    this.filterAction.set(value);
    this.applyFilters();
  }

  onFilterResourceTypeChange(value: string): void {
    this.filterResourceType.set(value);
    this.applyFilters();
  }

  onFilterDateFromChange(value: string): void {
    this.filterDateFrom.set(value);
    this.applyFilters();
  }

  onFilterDateToChange(value: string): void {
    this.filterDateTo.set(value);
    this.applyFilters();
  }

  // ─── Pagination ───
  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.update((p) => p + 1);
      this.loadLogs();
    }
  }

  prevPage(): void {
    if (this.hasPrevPage()) {
      this.currentPage.update((p) => p - 1);
      this.loadLogs();
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadLogs();
  }

  // ─── Expand / Collapse ───
  toggleExpand(logId: number): void {
    this.expandedLogId.update((current) =>
      current === logId ? null : logId
    );
  }

  isExpanded(logId: number): boolean {
    return this.expandedLogId() === logId;
  }

  // ─── Display helpers ───
  getActionLabel(action: string): string {
    const map: Record<string, string> = {
      CREATE: 'Creación',
      UPDATE: 'Actualización',
      DELETE: 'Eliminación',
      LOGIN: 'Inicio de sesión',
      LOGOUT: 'Cierre de sesión',
      OTHER: 'Otro',
    };
    return map[action] || action;
  }

  getResourceTypeLabel(type: string): string {
    const map: Record<string, string> = {
      user: 'Usuario',
      company: 'Compañía',
      auth: 'Autenticación',
      property: 'Propiedad',
      contract: 'Contrato',
      appointment: 'Cita',
    };
    return map[type] || type;
  }

  getChangesKeys(changes: Record<string, any>): string[] {
    return Object.keys(changes || {});
  }

  getFieldLabel(field: string): string {
    const map: Record<string, string> = {
      first_name: 'Nombre',
      last_name: 'Apellido',
      username: 'Usuario',
      role: 'Rol',
      company: 'Compañía',
      name: 'Nombre',
      is_active: 'Activo',
      email: 'Correo',
    };
    return map[field] || field;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '—';
    if (value === true) return 'Sí';
    if (value === false) return 'No';
    return String(value);
  }

  getVisiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}