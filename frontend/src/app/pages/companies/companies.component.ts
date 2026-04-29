import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CompaniesService, Company } from '../../services/companies.service';
import { ToastService } from '../../shared/components/toast';

import {
  LucideBuilding2,
  LucideCheck,
  LucideLock,
  LucidePlus,
  LucideSearch,
  LucideX,
  LucideCalendarDays,
} from '@lucide/angular';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideBuilding2,
    LucideCheck,
    LucideLock,
    LucidePlus,
    LucideSearch,
    LucideX,
    LucideCalendarDays,
  ],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss',
})
export class CompaniesComponent implements OnInit {
  // ─── Services ───
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private companiesService = inject(CompaniesService);
  private toast = inject(ToastService);

  // ─── Signals ───
  companies = signal<Company[]>([]);
  isPlatformAdmin = signal(false);
  showForm = signal(false);
  searchTerm = signal('');
  isLoading = signal(false);

  // ─── Form ───
  companyForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
  });

  // ─── Computed ───
  filteredCompanies = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.companies();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) || c.id.toString().includes(term)
    );
  });

  ngOnInit(): void {
    this.authService.refreshUserFromStorage();
    this.isPlatformAdmin.set(this.authService.isPlatformAdmin());
    if (this.isPlatformAdmin()) {
      this.loadCompanies();
    }
  }

  loadCompanies(): void {
    this.isLoading.set(true);
    this.companiesService.list().subscribe({
      next: (data) => {
        this.companies.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar las compañías.');
        this.isLoading.set(false);
      },
    });
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
  }

  onSubmit(): void {
    if (this.companyForm.invalid) return;

    this.companiesService.create(this.companyForm.value).subscribe({
      next: () => {
        this.toast.success('Compañía creada exitosamente.');
        this.companyForm.reset();
        this.showForm.set(false);
        this.loadCompanies();
      },
      error: () => {
        this.toast.error('No se pudo crear la compañía.');
      },
    });
  }
}