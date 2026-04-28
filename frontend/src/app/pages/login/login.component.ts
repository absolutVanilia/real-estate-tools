import {
  Component,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  form: FormGroup;
  error = '';
  submitting = false;
  currentYear = new Date().getFullYear();
  showPassword = false;

  // ─── FIX: flag de autofill detectado ───
  autofilled = false;

  private destroy$ = new Subject<void>();
  private autofillCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private elRef: ElementRef
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  // ──────────────────────────────────────────────────────
  //  FIX: Detectar autofill vía pseudo-clase CSS
  //  No leemos valores (Chrome los oculta), solo detectamos
  //  que el navegador aplicó :-webkit-autofill a los inputs
  // ──────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    // ─── Detectar autofill vía pseudo-clase CSS ───
    this.ngZone.runOutsideAngular(() => {
      let checks = 0;
      this.autofillCheckTimer = setInterval(() => {
        checks++;
        const autofilled = this.detectAutofill();
        if (autofilled && !this.autofilled) {
          this.ngZone.run(() => {
            this.autofilled = true;
            this.cdr.detectChanges();
          });
          this.clearAutofillTimer();
        }
        if (checks >= 25) {
          this.clearAutofillTimer();
        }
      }, 200);
    });
  
    // ──────────────────────────────────────────────────
    //  FIX: Cuando el usuario escribe/borra manualmente,
    //  apagar el flag autofilled para que la validación
    //  normal del form retome el control del botón.
    // ──────────────────────────────────────────────────
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autofilled) {
          this.autofilled = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Usa la pseudo-clase CSS :-webkit-autofill / :autofill
   * para detectar si el navegador autocompletó los campos.
   * Esto SÍ funciona aunque input.value esté vacío.
   */
  private detectAutofill(): boolean {
    try {
      const root = this.elRef.nativeElement as HTMLElement;
      const autofilledInputs = root.querySelectorAll(
        'input:-webkit-autofill'
      );
      return autofilledInputs.length >= 2; // username + password
    } catch {
      return false;
    }
  }

  /**
   * Sincroniza los valores nativos del DOM al FormGroup.
   * Se llama SOLO en onSubmit(), cuando el usuario ya hizo clic
   * y Chrome libera los valores.
   */
  private syncNativeValues(): void {
    const usernameEl = document.getElementById('username') as HTMLInputElement;
    const passwordEl = document.getElementById('password') as HTMLInputElement;

    if (!usernameEl || !passwordEl) return;

    this.form.patchValue({
      username: usernameEl.value,
      password: passwordEl.value
    });
    this.form.updateValueAndValidity();
  }

  private clearAutofillTimer(): void {
    if (this.autofillCheckTimer) {
      clearInterval(this.autofillCheckTimer);
      this.autofillCheckTimer = null;
    }
  }

  onSubmit(): void {
    // ── FIX: Si hubo autofill, ahora que el usuario hizo clic,
    //    Chrome ya expone los valores → sincronizamos ──
    if (this.autofilled) {
      this.syncNativeValues();
      this.autofilled = false; // reset flag
    }

    if (this.form.invalid || this.submitting) return;

    this.error = '';
    this.submitting = true;

    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/contratos';
    const safeUrl = returnUrl.startsWith('/') ? returnUrl : '/contratos';

    this.authService
      .login(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigateByUrl(safeUrl);
        },
        error: () => {
          this.error = 'Usuario o contraseña incorrectos.';
          this.submitting = false;
          this.cdr.detectChanges();
        }
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnDestroy(): void {
    this.clearAutofillTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }
}