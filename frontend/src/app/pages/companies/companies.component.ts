import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CompaniesService, Company } from '../../services/companies.service';

import {
  LucideBuilding2,
  LucideCheck,
  LucideCircleCheck,
  LucideCircleX,
  LucideLock,
  LucidePlus,
  LucideSearch,
  LucideX,
  LucideCalendarDays
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
    LucideCircleCheck,
    LucideCircleX,
    LucideLock,
    LucidePlus,
    LucideSearch,
    LucideX,
    LucideCalendarDays
  ],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss'
})
export class CompaniesComponent implements OnInit {
  // ─── Signals ───
  companies = signal<Company[]>([]);
  message = signal('');
  error = signal('');
  isPlatformAdmin = signal(false);
  showForm = signal(false);
  searchTerm = signal('');
  isLoading = signal(false);

  // ─── Form ───
  companyForm: FormGroup;

  // ─── Computed ───
  filteredCompanies = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.companies();
    if (!term) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.id.toString().includes(term)
    );
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private companiesService: CompaniesService,
    private cdr: ChangeDetectorRef
  ) {
    this.companyForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

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
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('No se pudo cargar las compañías.');
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  toggleForm(): void {
    this.showForm.update(v => !v);
  }

  onSubmit(): void {
    if (this.companyForm.invalid) return;

    this.error.set('');
    this.message.set('');

    this.companiesService.create(this.companyForm.value).subscribe({
      next: () => {
        this.message.set('Compañía creada exitosamente.');
        this.companyForm.reset();
        this.showForm.set(false);
        this.loadCompanies();
        this.cdr.markForCheck();

        setTimeout(() => {
          this.message.set('');
          this.cdr.markForCheck();
        }, 4000);
      },
      error: () => {
        this.error.set('No se pudo crear la compañía.');
        this.cdr.markForCheck();

        setTimeout(() => {
          this.error.set('');
          this.cdr.markForCheck();
        }, 5000);
      }
    });
  }
}