import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CompaniesService, Company } from '../../services/companies.service';
import { UserItem, UsersService, UserRole } from '../../services/users.service';

import {
  LucideUsers,
  LucideUserPlus,
  LucideUserCog,
  LucideSearch,
  LucideCheck,
  LucideX,
  LucidePencil,
  LucideTrash2,
  LucideCircleCheck,
  LucideCircleX,
  LucideShieldAlert,
  LucideCalendarDays,
  LucideBuilding2,
  LucideEye,
  LucideLock
} from '@lucide/angular';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideUsers,
    LucideUserPlus,
    LucideUserCog,
    LucideSearch,
    LucideCheck,
    LucideX,
    LucidePencil,
    LucideTrash2,
    LucideCircleCheck,
    LucideCircleX,
    LucideShieldAlert,
    LucideCalendarDays,
    LucideBuilding2,
    LucideEye,
    LucideLock
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  // ─── Signals ───
  users = signal<UserItem[]>([]);
  companies = signal<Company[]>([]);
  message = signal('');
  error = signal('');
  showForm = signal(false);
  editingUserId = signal<number | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  deletingUserId = signal<number | null>(null);

  // ─── Form ───
  roles: UserRole[] = ['admin', 'promotor'];
  userForm: FormGroup;

  // ─── Computed ───
  isEditing = computed(() => this.editingUserId() !== null);

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.users();
    if (!term) return list;
    return list.filter(u =>
      u.first_name.toLowerCase().includes(term) ||
      u.last_name.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      u.id.toString().includes(term)
    );
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private cdr: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['promotor', Validators.required],
      company: [null as number | null]
    });
  }

  // ─── Auth getters ───
  get canManageUsers(): boolean {
    const u = this.authService.getCurrentUser();
    return !!u && (u.is_platform_admin || u.role === 'admin');
  }

  get isPlatformAdmin(): boolean {
    return this.authService.isPlatformAdmin();
  }

  get isPromotor(): boolean {
    const u = this.authService.getCurrentUser();
    return !!u && u.role === 'promotor' && !u.is_platform_admin;
  }

  ngOnInit(): void {
    this.authService.refreshUserFromStorage();
    this.syncCompanyValidators();
    this.loadCompaniesIfNeeded();
    this.loadUsers();
  }

  // ─── Data loading ───
  loadCompaniesIfNeeded(): void {
    if (!this.isPlatformAdmin) return;
    this.companiesService.list().subscribe({
      next: (data) => {
        this.companies.set(data);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('No se pudo cargar las compañías.');
        this.cdr.markForCheck();
      }
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.usersService.list().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de usuarios.');
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  // ─── Form management ───
  openCreateForm(): void {
    this.editingUserId.set(null);
    this.resetUserForm();
    this.showForm.set(true);
  }

  editUser(user: UserItem): void {
    if (!this.canManageUsers) return;

    this.editingUserId.set(user.id);
    this.showForm.set(true);

    this.userForm.patchValue({
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      password: '',
      role: user.role,
      company: user.company
    });

    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();

    if (this.isPlatformAdmin) {
      this.userForm.get('company')?.setValidators([Validators.required]);
    } else {
      this.userForm.get('company')?.clearValidators();
    }
    this.userForm.get('company')?.updateValueAndValidity();
  }

  cancelEdit(): void {
    this.editingUserId.set(null);
    this.showForm.set(false);
    this.resetUserForm();
  }

  toggleForm(): void {
    if (this.showForm()) {
      this.cancelEdit();
    } else {
      this.openCreateForm();
    }
  }

  // ─── Submit ───
  onSubmitUser(): void {
    if (this.userForm.invalid) return;

    this.error.set('');
    this.message.set('');

    if (this.isEditing()) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    const payload = {
      first_name: this.userForm.value.first_name,
      last_name: this.userForm.value.last_name,
      username: this.userForm.value.username,
      password: this.userForm.value.password,
      role: this.userForm.value.role as UserRole
    } as any;

    if (this.isPlatformAdmin) {
      payload.company = this.userForm.value.company;
    }

    this.usersService.create(payload).subscribe({
      next: () => {
        this.message.set('Usuario creado exitosamente.');
        this.resetUserForm();
        this.showForm.set(false);
        this.loadUsers();
        this.cdr.markForCheck();
        setTimeout(() => { this.message.set(''); this.cdr.markForCheck(); }, 4000);
      },
      error: () => {
        this.error.set('No se pudo crear el usuario.');
        this.cdr.markForCheck();
        setTimeout(() => { this.error.set(''); this.cdr.markForCheck(); }, 5000);
      }
    });
  }

  private updateUser(): void {
    const id = this.editingUserId();
    if (!id) return;

    const payload = {
      first_name: this.userForm.value.first_name,
      last_name: this.userForm.value.last_name,
      username: this.userForm.value.username,
      role: this.userForm.value.role as UserRole
    } as any;

    if (this.userForm.value.password) {
      payload.password = this.userForm.value.password;
    }

    if (this.isPlatformAdmin) {
      payload.company = this.userForm.value.company;
    }

    this.usersService.update(id, payload).subscribe({
      next: () => {
        this.message.set('Usuario actualizado exitosamente.');
        this.cancelEdit();
        this.loadUsers();
        this.cdr.markForCheck();
        setTimeout(() => { this.message.set(''); this.cdr.markForCheck(); }, 4000);
      },
      error: () => {
        this.error.set('No se pudo actualizar el usuario.');
        this.cdr.markForCheck();
        setTimeout(() => { this.error.set(''); this.cdr.markForCheck(); }, 5000);
      }
    });
  }

  // ─── Delete ───
  confirmDelete(userId: number): void {
    this.deletingUserId.set(userId);
  }

  cancelDelete(): void {
    this.deletingUserId.set(null);
  }

  deleteUser(userId: number): void {
    if (!this.canManageUsers) return;

    this.error.set('');
    this.message.set('');
    this.deletingUserId.set(null);

    this.usersService.remove(userId).subscribe({
      next: () => {
        this.message.set('Usuario eliminado.');
        this.loadUsers();
        this.cdr.markForCheck();
        setTimeout(() => { this.message.set(''); this.cdr.markForCheck(); }, 4000);
      },
      error: () => {
        this.error.set('No se pudo eliminar el usuario.');
        this.cdr.markForCheck();
        setTimeout(() => { this.error.set(''); this.cdr.markForCheck(); }, 5000);
      }
    });
  }

  // ─── Helpers ───
  getInitials(user: UserItem): string {
    const f = user.first_name?.charAt(0) || '';
    const l = user.last_name?.charAt(0) || '';
    return (f + l).toUpperCase() || user.username.charAt(0).toUpperCase();
  }

  getCompanyName(companyId: number | null): string {
    if (!companyId) return '—';
    const found = this.companies().find(c => c.id === companyId);
    return found ? found.name : `#${companyId}`;
  }

  private resetUserForm(): void {
    this.userForm.reset({
      first_name: '',
      last_name: '',
      username: '',
      password: '',
      role: 'promotor',
      company: null
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.syncCompanyValidators();
  }

  private syncCompanyValidators(): void {
    const companyCtrl = this.userForm.get('company');
    if (!companyCtrl) return;
    if (this.isPlatformAdmin) {
      companyCtrl.setValidators([Validators.required]);
    } else {
      companyCtrl.clearValidators();
    }
    companyCtrl.updateValueAndValidity();
  }
}