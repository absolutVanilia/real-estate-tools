import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { OwnersService, Owner, OwnerFilters } from '../../services/owners.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/components/toast';

import {
  LucideSearch,
  LucideFilter,
  LucidePlus,
  LucideX,
  LucideCheck,
  LucidePencil,
  LucidePhone,
  LucideUser,
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronDown,
  LucideChevronUp,
  LucideRefreshCw,
  LucideMail,
  LucideIdCard,
  LucideUsers,
  LucideToggleLeft,
  LucideToggleRight,
} from '@lucide/angular';

@Component({
  selector: 'app-propietarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideSearch,
    LucideFilter,
    LucidePlus,
    LucideX,
    LucideCheck,
    LucidePencil,
    LucidePhone,
    LucideUser,
    LucideChevronLeft,
    LucideChevronRight,
    LucideChevronDown,
    LucideChevronUp,
    LucideRefreshCw,
    LucideMail,
    LucideIdCard,
    LucideUsers,
    LucideToggleLeft,
    LucideToggleRight,
  ],
  templateUrl: './propietarios.component.html',
  styleUrl: './propietarios.component.scss',
})
export class PropietariosComponent implements OnInit {
  // ─── Services ───
  private fb = inject(FormBuilder);
  private ownersService = inject(OwnersService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  // ─── State ───
  owners = signal<Owner[]>([]);
  totalCount = signal(0);
  isLoading = signal(false);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  expandedId = signal<number | null>(null);
  showFilters = signal(false);

  // ─── Filters ───
  searchTerm = signal('');
  filterActive = signal('');
  currentPage = signal(1);
  pageSize = signal(25);

  // ─── Form ───
  ownerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    cedula: ['', Validators.required],
    phone: [''],
    email: ['', Validators.email],
  });

  // ─── Computed ───
  isEditing = computed(() => this.editingId() !== null);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPrevPage = computed(() => this.currentPage() > 1);

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.filterActive()) count++;
    return count;
  });

  // ─── Stats ───
  statsActivos = computed(() =>
    this.owners().filter((o) => o.is_active).length
  );
  statsInactivos = computed(() =>
    this.owners().filter((o) => !o.is_active).length
  );

  private searchTimeout: any;

  ngOnInit(): void {
    this.authService.refreshUserFromStorage();
    this.loadOwners();
  }

  // ─── Data ───
  loadOwners(): void {
    this.isLoading.set(true);

    const filters: OwnerFilters = {
      page: this.currentPage(),
      page_size: this.pageSize(),
    };

    if (this.searchTerm().trim()) filters.search = this.searchTerm().trim();
    if (this.filterActive()) filters.is_active = this.filterActive();

    this.ownersService.list(filters).subscribe({
      next: (res) => {
        this.owners.set(res.results);
        this.totalCount.set(res.count);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los propietarios.');
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
      this.loadOwners();
    }, 400);
  }

  // ─── Filters ───
  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadOwners();
  }

  clearFilters(): void {
    this.filterActive.set('');
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadOwners();
  }

  // ─── Form ───
  openCreateForm(): void {
    this.editingId.set(null);
    this.ownerForm.reset({
      name: '',
      cedula: '',
      phone: '',
      email: '',
    });
    this.showForm.set(true);
  }

  editOwner(owner: Owner): void {
    this.editingId.set(owner.id);
    this.ownerForm.patchValue({
      name: owner.name,
      cedula: owner.cedula,
      phone: owner.phone,
      email: owner.email,
    });
    this.showForm.set(true);
    this.expandedId.set(null);
  }

  cancelForm(): void {
    this.editingId.set(null);
    this.showForm.set(false);
    this.ownerForm.reset();
  }

  toggleForm(): void {
    if (this.showForm()) {
      this.cancelForm();
    } else {
      this.openCreateForm();
    }
  }

  onSubmit(): void {
    if (this.ownerForm.invalid) return;

    const payload = this.ownerForm.value;

    if (this.isEditing()) {
      const id = this.editingId()!;
      this.ownersService.update(id, payload).subscribe({
        next: () => {
          this.toast.success('Propietario actualizado exitosamente.');
          this.cancelForm();
          this.loadOwners();
        },
        error: (err) => {
          this.handleError(err, 'No se pudo actualizar el propietario.');
        },
      });
    } else {
      this.ownersService.create(payload).subscribe({
        next: () => {
          this.toast.success('Propietario registrado exitosamente.');
          this.cancelForm();
          this.loadOwners();
        },
        error: (err) => {
          this.handleError(err, 'No se pudo registrar el propietario.');
        },
      });
    }
  }

  private handleError(err: any, fallback: string): void {
    let msg = fallback;
    if (err?.error?.cedula) {
      msg = 'Ya existe un propietario con esta cédula en su compañía.';
    }
    this.toast.error(msg);
  }

  // ─── Toggle active ───
  toggleActive(owner: Owner): void {
    this.ownersService.toggleActive(owner.id).subscribe({
      next: () => {
        const newState = owner.is_active ? 'inactivo' : 'activo';
        this.toast.success(`Propietario marcado como ${newState}.`);
        this.loadOwners();
      },
      error: () => {
        this.toast.error('No se pudo cambiar el estado del propietario.');
      },
    });
  }

  // ─── Expand ───
  toggleExpand(id: number): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  isExpanded(id: number): boolean {
    return this.expandedId() === id;
  }

  // ─── Pagination ───
  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.update((p) => p + 1);
      this.loadOwners();
    }
  }

  prevPage(): void {
    if (this.hasPrevPage()) {
      this.currentPage.update((p) => p - 1);
      this.loadOwners();
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadOwners();
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

  // ─── Helpers ───
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
}