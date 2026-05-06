import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  AppointmentsService,
  Appointment,
  AppointmentFilters,
} from '../../services/appointments.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/components/toast';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

import {
  LucideCalendarDays,
  LucideSearch,
  LucideFilter,
  LucidePlus,
  LucideX,
  LucideCheck,
  LucidePencil,
  LucideTrash2,
  LucideCircleCheck,
  LucideCircleX,
  LucideClock,
  LucideMapPin,
  LucidePhone,
  LucideUser,
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronDown,
  LucideChevronUp,
  LucideKey,
  LucideHash,
  LucideFileText,
  LucideRefreshCw,
  LucideHome,
  LucideInfo,
} from '@lucide/angular';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [
    LoadingStateComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideCalendarDays,
    LucideSearch,
    LucideFilter,
    LucidePlus,
    LucideX,
    LucideCheck,
    LucidePencil,
    LucideTrash2,
    LucideCircleCheck,
    LucideCircleX,
    LucideClock,
    LucideMapPin,
    LucidePhone,
    LucideUser,
    LucideChevronLeft,
    LucideChevronRight,
    LucideChevronDown,
    LucideChevronUp,
    LucideKey,
    LucideHash,
    LucideFileText,
    LucideRefreshCw,
    LucideHome,
    LucideInfo,
  ],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.scss',
})
export class CitasComponent implements OnInit {
  // ─── Services ───
  private fb = inject(FormBuilder);
  private appointmentsService = inject(AppointmentsService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  // ─── State ───
  appointments = signal<Appointment[]>([]);
  totalCount = signal(0);
  isLoading = signal(false);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  expandedId = signal<number | null>(null);
  deletingId = signal<number | null>(null);
  showFilters = signal(false);

  // ─── Filters ───
  searchTerm = signal('');
  filterStatus = signal('');
  filterDateFrom = signal('');
  filterDateTo = signal('');
  currentPage = signal(1);
  pageSize = signal(25);

  // ─── Form ───
  appointmentForm: FormGroup = this.fb.group({
    date: ['', Validators.required],
    time: ['', Validators.required],
    interested_name: ['', Validators.required],
    interested_phone: [''],
    property_address: ['', Validators.required],
    sector: [''],
    property_code: [''],
    key_number: [''],
    status: ['pendiente', Validators.required],
    notes: [''],
  });

  // ─── Computed ───
  isEditing = computed(() => this.editingId() !== null);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPrevPage = computed(() => this.currentPage() > 1);

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.filterStatus()) count++;
    if (this.filterDateFrom()) count++;
    if (this.filterDateTo()) count++;
    return count;
  });

  // ─── Stats ───
  statsPendientes = computed(() =>
    this.appointments().filter((a) => a.status === 'pendiente').length
  );
  statsConfirmadas = computed(() =>
    this.appointments().filter((a) => a.status === 'confirmada').length
  );
  statsCanceladas = computed(() =>
    this.appointments().filter((a) => a.status === 'cancelada').length
  );

  private searchTimeout: any;

  ngOnInit(): void {
    this.authService.refreshUserFromStorage();
    this.loadAppointments();
  }

  // ─── Data ───
  loadAppointments(): void {
    this.isLoading.set(true);

    const filters: AppointmentFilters = {
      page: this.currentPage(),
      page_size: this.pageSize(),
    };

    if (this.searchTerm().trim()) filters.search = this.searchTerm().trim();
    if (this.filterStatus()) filters.status = this.filterStatus();
    if (this.filterDateFrom()) filters.date_from = this.filterDateFrom();
    if (this.filterDateTo()) filters.date_to = this.filterDateTo();

    this.appointmentsService.list(filters).subscribe({
      next: (res) => {
        this.appointments.set(res.results);
        this.totalCount.set(res.count);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('No se pudieron cargar las citas.');
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
      this.loadAppointments();
    }, 400);
  }

  // ─── Filters ───
  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadAppointments();
  }

  clearFilters(): void {
    this.filterStatus.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadAppointments();
  }

  // ─── Form ───
  openCreateForm(): void {
    this.editingId.set(null);
    this.appointmentForm.reset({
      date: '',
      time: '',
      interested_name: '',
      interested_phone: '',
      property_address: '',
      sector: '',
      property_code: '',
      key_number: '',
      status: 'pendiente',
      notes: '',
    });
    this.showForm.set(true);
  }

  editAppointment(appointment: Appointment): void {
    this.editingId.set(appointment.id);
    this.appointmentForm.patchValue({
      date: appointment.date,
      time: appointment.time,
      interested_name: appointment.interested_name,
      interested_phone: appointment.interested_phone,
      property_address: appointment.property_address,
      sector: appointment.sector,
      property_code: appointment.property_code,
      key_number: appointment.key_number,
      status: appointment.status,
      notes: appointment.notes,
    });
    this.showForm.set(true);
    this.expandedId.set(null);
  }

  cancelForm(): void {
    this.editingId.set(null);
    this.showForm.set(false);
    this.appointmentForm.reset();
  }

  toggleForm(): void {
    if (this.showForm()) {
      this.cancelForm();
    } else {
      this.openCreateForm();
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) return;

    const payload = this.appointmentForm.value;

    if (this.isEditing()) {
      const id = this.editingId()!;
      this.appointmentsService.update(id, payload).subscribe({
        next: () => {
          this.toast.success('Cita actualizada exitosamente.');
          this.cancelForm();
          this.loadAppointments();
        },
        error: () => {
          this.toast.error('No se pudo actualizar la cita.');
        },
      });
    } else {
      this.appointmentsService.create(payload).subscribe({
        next: () => {
          this.toast.success('Cita agendada exitosamente.');
          this.cancelForm();
          this.loadAppointments();
        },
        error: () => {
          this.toast.error('No se pudo agendar la cita.');
        },
      });
    }
  }

  // ─── Quick status update ───
  updateStatus(appointment: Appointment, newStatus: string): void {
    this.appointmentsService.update(appointment.id, { status: newStatus }).subscribe({
      next: () => {
        this.toast.success(`Estado actualizado a "${this.getStatusLabel(newStatus)}".`);
        this.loadAppointments();
      },
      error: () => {
        this.toast.error('No se pudo actualizar el estado.');
      },
    });
  }

  // ─── Delete ───
  confirmDelete(id: number): void {
    this.deletingId.set(id);
  }

  cancelDelete(): void {
    this.deletingId.set(null);
  }

  deleteAppointment(id: number): void {
    this.deletingId.set(null);
    this.appointmentsService.remove(id).subscribe({
      next: () => {
        this.toast.success('Cita eliminada.');
        this.loadAppointments();
      },
      error: () => {
        this.toast.error('No se pudo eliminar la cita.');
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
      this.loadAppointments();
    }
  }

  prevPage(): void {
    if (this.hasPrevPage()) {
      this.currentPage.update((p) => p - 1);
      this.loadAppointments();
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadAppointments();
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
  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada',
    };
    return map[status] || status;
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  isToday(dateStr: string): boolean {
    const today = new Date();
    const date = new Date(dateStr + 'T00:00:00');
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  isPast(dateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr + 'T00:00:00');
    return date < today;
  }
}