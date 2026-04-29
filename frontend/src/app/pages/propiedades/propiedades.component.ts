  import {
    Component,
    OnInit,
    signal,
    computed,
    DestroyRef,
    inject,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
  } from '@angular/forms';
  import { FormsModule } from '@angular/forms';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import {
    Subject,
    switchMap,
    debounceTime,
    distinctUntilChanged,
    tap,
    startWith,
    catchError,
    of,
  } from 'rxjs';
  
  import {
    PropertiesService,
    Property,
    PropertyFilters,
    TeamMember,
    OwnerMini,
  } from '../../services/properties.service';
  import { OwnersService, Owner } from '../../services/owners.service';
  import { AuthService } from '../../services/auth.service';
  import { ToastService } from '../../shared/components/toast';
  
  import {
    LucideSearch, LucideFilter, LucidePlus, LucideX, LucideCheck,
    LucidePencil, LucideTrash2, LucideCircleCheck, LucideCircleX,
    LucidePhone, LucideUser, LucideChevronLeft, LucideChevronRight,
    LucideChevronDown, LucideChevronUp, LucideRefreshCw, LucideMail,
    LucideHome, LucideMapPin, LucideBuilding, LucideHash, LucideFileText,
    LucideDollarSign, LucideRuler, LucideBedDouble, LucideBath,
    LucideCar, LucideKey, LucideFlame, LucideZap, LucideChefHat,
    LucideInfo, LucideUsers, LucideClipboardList, LucideArrowRight,
    LucideArrowLeft, LucideCheckCircle2, LucidePackage, LucideShowerHead,
  } from '@lucide/angular';
  
  // ═══════════════════════════════════
  //  INTERFACES LOCALES
  // ═══════════════════════════════════
  interface StepDef {
    num: number;
    label: string;
  }
  
  // ═══════════════════════════════════
  //  COMPONENTE
  // ═══════════════════════════════════
  @Component({
    selector: 'app-propiedades',
    standalone: true,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      FormsModule,
      LucideSearch, LucideFilter, LucidePlus, LucideX, LucideCheck,
      LucidePencil, LucideTrash2, LucideCircleCheck, LucideCircleX,
      LucidePhone, LucideUser, LucideChevronLeft, LucideChevronRight,
      LucideChevronDown, LucideChevronUp, LucideRefreshCw, LucideMail,
      LucideHome, LucideMapPin, LucideBuilding, LucideHash, LucideFileText,
      LucideDollarSign, LucideRuler, LucideBedDouble, LucideBath,
      LucideCar, LucideKey, LucideFlame, LucideZap, LucideChefHat,
      LucideInfo, LucideUsers, LucideClipboardList, LucideArrowRight,
      LucideArrowLeft, LucideCheckCircle2, LucidePackage, LucideShowerHead,
    ],
    templateUrl: './propiedades.component.html',
    styleUrl: './propiedades.component.scss',
  })
  export class PropiedadesComponent implements OnInit {
  
    // ═══════════════════════════════════
    //  DEPENDENCY INJECTION
    // ═══════════════════════════════════
    private fb = inject(FormBuilder);
    private propertiesService = inject(PropertiesService);
    private ownersService = inject(OwnersService);
    private authService = inject(AuthService);
    private destroyRef = inject(DestroyRef);
    private toast = inject(ToastService);
  
    // ═══════════════════════════════════
    //  CORE STATE (Signals)
    // ═══════════════════════════════════
    properties = signal<Property[]>([]);
    totalCount = signal(0);
    isLoading = signal(false);
    showForm = signal(false);
    editingId = signal<number | null>(null);
    expandedId = signal<number | null>(null);
    deletingId = signal<number | null>(null);
    showFilters = signal(false);
    formStep = signal(1);
  
    // ─── Filters (Signals) ───
    searchTerm = signal('');
    filterEstrato = signal('');
    filterPreInventario = signal('');
    filterSector = signal('');
    currentPage = signal(1);
    pageSize = signal(25);
  
    // ─── Dropdown data ───
    availableOwners = signal<Owner[]>([]);
    teamMembers = signal<TeamMember[]>([]);
    selectedOwnerIds = signal<number[]>([]);
    ownerSearchTerm = signal('');
  
    // ─── Form ───
    propertyForm!: FormGroup;
  
    // ─── Signal reactivo al estado del formulario (resuelve bug #5) ───
    formStatus = signal<string>('INVALID');
    formCodigoValid = signal(false);
    formDireccionValid = signal(false);
  
    // ─── Trigger para recargar propiedades (resuelve bugs #1 y #3) ───
    private loadTrigger$ = new Subject<void>();
    private searchInput$ = new Subject<string>();
  
    // ═══════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════
    readonly TOTAL_STEPS = 5;
  
    readonly steps: StepDef[] = [
      { num: 1, label: 'Identificación y Ubicación' },
      { num: 2, label: 'Información Comercial' },
      { num: 3, label: 'Distribución' },
      { num: 4, label: 'Equipamiento y Servicios' },
      { num: 5, label: 'Relaciones y Observaciones' },
    ];
  
    readonly TIPO_ZONA_SOCIAL_OPTIONS = [
      { value: 'sala', label: 'Sala' },
      { value: 'comedor', label: 'Comedor' },
      { value: 'sala_comedor', label: 'Sala comedor' },
      { value: 'ninguno', label: 'Ninguno' },
    ];
  
    readonly TIPO_COCINA_OPTIONS = [
      { value: '', label: 'Sin especificar' },
      { value: 'integral', label: 'Integral' },
      { value: 'semi_integral', label: 'Semi integral' },
      { value: 'sencilla', label: 'Sencilla' },
      { value: 'tipo_americano', label: 'Tipo americano' },
      { value: 'otro', label: 'Otro' },
    ];
  
    readonly TIPO_PISO_OPTIONS = [
      { value: '', label: 'Sin especificar' },
      { value: 'ceramica', label: 'Cerámica' },
      { value: 'marmol', label: 'Mármol' },
      { value: 'porcelanato', label: 'Porcelanato' },
      { value: 'madera', label: 'Madera' },
      { value: 'baldosa', label: 'Baldosa' },
      { value: 'cemento', label: 'Cemento' },
      { value: 'laminado', label: 'Laminado' },
      { value: 'otro', label: 'Otro' },
    ];
  
    // ═══════════════════════════════════
    //  COMPUTED SIGNALS
    // ═══════════════════════════════════
    isEditing = computed(() => this.editingId() !== null);
    totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
    hasNextPage = computed(() => this.currentPage() < this.totalPages());
    hasPrevPage = computed(() => this.currentPage() > 1);
  
    activeFiltersCount = computed(() => {
      let c = 0;
      if (this.filterEstrato()) c++;
      if (this.filterPreInventario()) c++;
      if (this.filterSector()) c++;
      return c;
    });
  
    statsArriendo = computed(() =>
      this.properties().filter(p => p.precio_arriendo !== null && p.precio_arriendo > 0).length
    );
  
    statsVenta = computed(() =>
      this.properties().filter(p => p.precio_venta !== null && p.precio_venta > 0).length
    );
  
    statsPreInv = computed(() =>
      this.properties().filter(p => p.pre_inventario).length
    );
  
    filteredOwners = computed(() => {
      const term = this.ownerSearchTerm().toLowerCase();
      const owners = this.availableOwners();
      if (!term) return owners;
      return owners.filter(o =>
        o.name.toLowerCase().includes(term) || o.cedula.includes(term)
      );
    });
  
    // ─── Resuelve bugs #4 y #5: Ahora es 100% reactivo ───
    canGoNext = computed(() => {
      const step = this.formStep();
      if (step === 1) {
        return this.formCodigoValid() && this.formDireccionValid();
      }
      return true;
    });
  
    // ─── Signal derivado: filtros actuales como objeto ───
    private currentFilters = computed<PropertyFilters>(() => {
      const filters: PropertyFilters = {
        page: this.currentPage(),
        page_size: this.pageSize(),
      };
      const search = this.searchTerm().trim();
      if (search) filters.search = search;
      if (this.filterEstrato()) filters.estrato = this.filterEstrato();
      if (this.filterPreInventario()) filters.pre_inventario = this.filterPreInventario();
      if (this.filterSector()) filters.sector = this.filterSector();
      return filters;
    });
  
    // ═══════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════
    constructor() {
      this.initForm();
      this.setupSearchDebounce();
      this.setupLoadPipeline();
    }
  
    // ═══════════════════════════════════
    //  FORM INITIALIZATION
    // ═══════════════════════════════════
    private initForm(): void {
      this.propertyForm = this.fb.group({
        // Step 1
        codigo: ['', Validators.required],
        pre_inventario: [false],
        direccion: ['', Validators.required],
        sector: [''],
        punto_referencia: [''],
        // Step 2
        precio_arriendo: [null],
        precio_venta: [null],
        area: [null],
        piso_numero: [null],
        estrato: [null],
        // Step 3
        alcobas: [0],
        banos: [0],
        tipo_zona_social: ['ninguno'],
        alcoba_servicio: [false],
        cuarto_util: [false],
        patio: [false],
        zona_ropa: [false],
        balcon: [false],
        terraza: [false],
        solar: [false],
        sotano: [false],
        // Step 4
        parqueadero: [false],
        numero_closets: [0],
        numero_llaves: [0],
        luz_trifilar: [false],
        gas: [false],
        calentador: [false],
        tipo_cocina: [''],
        tipo_piso: [''],
        // Step 5
        asesor: [null],
        observacion: [''],
        novedad: [''],
      });
  
      // ─── Sincronizar ReactiveForm → Signals (resuelve bug #5) ───
      this.propertyForm.statusChanges.pipe(
        startWith(this.propertyForm.status),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(status => {
        this.formStatus.set(status);
      });
  
      // Signals individuales para campos críticos del step 1
      const codigoCtrl = this.propertyForm.get('codigo')!;
      const dirCtrl = this.propertyForm.get('direccion')!;
  
      codigoCtrl.statusChanges.pipe(
        startWith(codigoCtrl.status),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.formCodigoValid.set(codigoCtrl.valid);
      });
  
      dirCtrl.statusChanges.pipe(
        startWith(dirCtrl.status),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.formDireccionValid.set(dirCtrl.valid);
      });
    }
  
    // ═══════════════════════════════════
    //  REACTIVE PIPELINES (resuelve bugs #1, #2, #3)
    // ═══════════════════════════════════
  
    /**
     * Bug #1 resuelto: debounceTime reemplaza setTimeout manual.
     * Se limpia automáticamente con takeUntilDestroyed.
     */
    private setupSearchDebounce(): void {
      this.searchInput$.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(term => {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        this.loadTrigger$.next();
      });
    }
  
    /**
     * Bug #3 resuelto: switchMap cancela peticiones anteriores automáticamente.
     * Bug #2 resuelto: takeUntilDestroyed cancela la subscripción al destruir.
     */
    private setupLoadPipeline(): void {
      this.loadTrigger$.pipe(
        tap(() => {
          this.isLoading.set(true);
        }),
        switchMap(() =>
          this.propertiesService.list(this.currentFilters()).pipe(
            catchError(() => {
              this.toast.error('No se pudieron cargar las propiedades.');
              return of(null);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(res => {
        if (res) {
          this.properties.set(res.results);
          this.totalCount.set(res.count);
        }
        this.isLoading.set(false);
      });
    }
  
    // ═══════════════════════════════════
    //  LIFECYCLE
    // ═══════════════════════════════════
    ngOnInit(): void {
      this.authService.refreshUserFromStorage();
      this.loadProperties();
    }
  
    // ═══════════════════════════════════
    //  DATA LOADING
    // ═══════════════════════════════════
    loadProperties(): void {
      this.loadTrigger$.next();
    }
  
    /**
     * Bug #6 resuelto: Ahora ambas llamadas tienen error handler.
     * Bug #2 resuelto: takeUntilDestroyed en ambas subscripciones.
     */
    private loadDropdowns(): void {
      this.ownersService.list({ page_size: 500, is_active: 'true' } as any).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.toast.error('No se pudieron cargar los propietarios.');
          return of(null);
        }),
      ).subscribe(res => {
        if (res) {
          this.availableOwners.set(res.results);
        }
      });
  
      this.propertiesService.getTeamMembers().pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.toast.error('No se pudieron cargar los asesores.');
          return of(null);
        }),
      ).subscribe((res: any) => {
        if (res) {
          const members = res.results || res;
          this.teamMembers.set(members);
        }
      });
    }
  
    // ═══════════════════════════════════
    //  SEARCH & FILTERS
    // ═══════════════════════════════════
  
    /**
     * Bug #1 resuelto: Ya no usa setTimeout manual,
     * delega al pipeline searchInput$ → debounceTime.
     */
    onSearchChange(term: string): void {
      this.searchInput$.next(term);
    }
  
    toggleFilters(): void {
      this.showFilters.update(v => !v);
    }
  
    onFilterChange(): void {
      this.currentPage.set(1);
      this.loadProperties();
    }
  
    clearFilters(): void {
      this.filterEstrato.set('');
      this.filterPreInventario.set('');
      this.filterSector.set('');
      this.searchTerm.set('');
      this.currentPage.set(1);
      this.loadProperties();
    }
  
    // ═══════════════════════════════════
    //  FORM WIZARD NAVIGATION
    // ═══════════════════════════════════
    nextStep(): void {
      if (this.formStep() < this.TOTAL_STEPS) {
        if (this.formStep() === 1) {
          this.propertyForm.get('codigo')?.markAsTouched();
          this.propertyForm.get('direccion')?.markAsTouched();
          if (!this.canGoNext()) {
            return;
          }
        }
        this.formStep.update(s => s + 1);
      }
    }
  
    prevStep(): void {
      if (this.formStep() > 1) {
        this.formStep.update(s => s - 1);
      }
    }
  
    /**
     * Bug #8 resuelto: Valida rango [1, TOTAL_STEPS].
     */
    goToStep(step: number): void {
      if (step < 1 || step > this.TOTAL_STEPS) return;
  
      if (step <= this.formStep()) {
        this.formStep.set(step);
      } else if (step === this.formStep() + 1 && this.canGoNext()) {
        this.formStep.set(step);
      }
    }
  
    isStepCompleted(step: number): boolean {
      if (step >= this.formStep()) return false;
      if (step === 1) {
        return this.formCodigoValid() && this.formDireccionValid();
      }
      return true;
    }
  
    isStepAccessible(step: number): boolean {
      return step <= this.formStep() || (step === this.formStep() + 1 && this.canGoNext());
    }
  
    // ═══════════════════════════════════
    //  FORM CRUD
    // ═══════════════════════════════════
    openCreateForm(): void {
      this.editingId.set(null);
      this.propertyForm.reset({
        codigo: '', pre_inventario: false, direccion: '', sector: '',
        punto_referencia: '', precio_arriendo: null, precio_venta: null,
        area: null, piso_numero: null, estrato: null, alcobas: 0, banos: 0,
        tipo_zona_social: 'ninguno', alcoba_servicio: false,
        cuarto_util: false, patio: false, zona_ropa: false,
        balcon: false, terraza: false, solar: false, sotano: false,
        parqueadero: false, numero_closets: 0, numero_llaves: 0,
        luz_trifilar: false, gas: false, calentador: false,
        tipo_cocina: '', tipo_piso: '', asesor: null,
        observacion: '', novedad: '',
      });
      this.selectedOwnerIds.set([]);
      this.ownerSearchTerm.set('');
      this.formStep.set(1);
      this.showForm.set(true);
      this.loadDropdowns();
    }
  
    editProperty(prop: Property): void {
      this.editingId.set(prop.id);
      this.propertyForm.patchValue({
        codigo: prop.codigo,
        pre_inventario: prop.pre_inventario,
        direccion: prop.direccion,
        sector: prop.sector,
        punto_referencia: prop.punto_referencia,
        precio_arriendo: prop.precio_arriendo,
        precio_venta: prop.precio_venta,
        area: prop.area,
        piso_numero: prop.piso_numero,
        estrato: prop.estrato,
        alcobas: prop.alcobas,
        banos: prop.banos,
        tipo_zona_social: prop.tipo_zona_social,
        alcoba_servicio: prop.alcoba_servicio,
        cuarto_util: prop.cuarto_util,
        patio: prop.patio,
        zona_ropa: prop.zona_ropa,
        balcon: prop.balcon,
        terraza: prop.terraza,
        solar: prop.solar,
        sotano: prop.sotano,
        parqueadero: prop.parqueadero,
        numero_closets: prop.numero_closets,
        numero_llaves: prop.numero_llaves,
        luz_trifilar: prop.luz_trifilar,
        gas: prop.gas,
        calentador: prop.calentador,
        tipo_cocina: prop.tipo_cocina,
        tipo_piso: prop.tipo_piso,
        asesor: prop.asesor,
        observacion: prop.observacion,
        novedad: prop.novedad,
      });
      this.selectedOwnerIds.set(prop.propietarios_detail?.map(o => o.id) ?? []);
      this.ownerSearchTerm.set('');
      this.formStep.set(1);
      this.showForm.set(true);
      this.expandedId.set(null);
      this.loadDropdowns();
    }
  
    cancelForm(): void {
      this.editingId.set(null);
      this.showForm.set(false);
      this.formStep.set(1);
      this.propertyForm.reset();
      this.selectedOwnerIds.set([]);
    }
  
    toggleForm(): void {
      if (this.showForm()) {
        this.cancelForm();
      } else {
        this.openCreateForm();
      }
    }
  
    /**
     * Bug #2 resuelto: takeUntilDestroyed.
     * Bug #11 resuelto: asesor envía null en vez de eliminar el campo.
     */
    onSubmit(): void {
      if (this.propertyForm.invalid) {
        this.propertyForm.markAllAsTouched();
        if (!this.formCodigoValid() || !this.formDireccionValid()) {
          this.formStep.set(1);
        }
        return;
      }
  
      const raw = this.propertyForm.value;
      const payload: any = {
        ...raw,
        propietarios_ids: this.selectedOwnerIds(),
      };
  
      // Bug #11: Enviar null explícitamente para desasignar asesor
      if (payload.asesor === '' || payload.asesor === undefined) {
        payload.asesor = null;
      }
  
      const request$ = this.isEditing()
        ? this.propertiesService.update(this.editingId()!, payload)
        : this.propertiesService.create(payload);
  
      request$.pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => {
          const msg = this.isEditing()
            ? 'Propiedad actualizada exitosamente.'
            : 'Propiedad registrada exitosamente.';
          this.toast.success(msg);
          this.cancelForm();
          this.loadProperties();
        },
        error: (err) => {
          const fallback = this.isEditing()
            ? 'No se pudo actualizar la propiedad.'
            : 'No se pudo registrar la propiedad.';
          this.handleError(err, fallback);
        },
      });
    }
  
    // ═══════════════════════════════════
    //  OWNERS SELECTION (M2M)
    // ═══════════════════════════════════
    isOwnerSelected(ownerId: number): boolean {
      return this.selectedOwnerIds().includes(ownerId);
    }
  
    toggleOwner(ownerId: number): void {
      this.selectedOwnerIds.update(ids =>
        ids.includes(ownerId)
          ? ids.filter(id => id !== ownerId)
          : [...ids, ownerId]
      );
    }
  
    removeOwner(ownerId: number): void {
      this.selectedOwnerIds.update(ids => ids.filter(id => id !== ownerId));
    }
  
    getOwnerById(id: number): Owner | undefined {
      return this.availableOwners().find(o => o.id === id);
    }
  
    onOwnerSearch(term: string): void {
      this.ownerSearchTerm.set(term);
    }
  
    // ═══════════════════════════════════
    //  DELETE
    // ═══════════════════════════════════
    confirmDelete(id: number): void {
      this.deletingId.set(id);
    }
  
    cancelDelete(): void {
      this.deletingId.set(null);
    }
  
    /**
     * Bug #2 resuelto: takeUntilDestroyed.
     */
    deleteProperty(id: number): void {
      this.deletingId.set(null);
      this.propertiesService.remove(id).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => {
          this.toast.success('Propiedad eliminada.');
          this.loadProperties();
        },
        error: () => {
          this.toast.error('No se pudo eliminar la propiedad.');
        },
      });
    }
  
    // ═══════════════════════════════════
    //  EXPAND
    // ═══════════════════════════════════
  
    /**
     * Bug #7 resuelto: Error handler agregado.
     * Bug #2 resuelto: takeUntilDestroyed.
     */
    toggleExpand(id: number): void {
      if (this.expandedId() === id) {
        this.expandedId.set(null);
        return;
      }
  
      this.expandedId.set(id);
  
      this.propertiesService.get(id).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.toast.error('No se pudo cargar el detalle de la propiedad.');
          return of(null);
        }),
      ).subscribe(full => {
        if (full) {
          this.properties.update(list =>
            list.map(p => p.id === id ? { ...p, ...full } : p)
          );
        }
      });
    }
  
    isExpanded(id: number): boolean {
      return this.expandedId() === id;
    }
  
    // ═══════════════════════════════════
    //  PAGINATION
    // ═══════════════════════════════════
    nextPage(): void {
      if (this.hasNextPage()) {
        this.currentPage.update(p => p + 1);
        this.loadProperties();
      }
    }
  
    prevPage(): void {
      if (this.hasPrevPage()) {
        this.currentPage.update(p => p - 1);
        this.loadProperties();
      }
    }
  
    goToPage(page: number): void {
      if (page < 1 || page > this.totalPages()) return;
      this.currentPage.set(page);
      this.loadProperties();
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
  
    // ═══════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════
    formatCurrency(value: number | null): string {
      if (value === null || value === undefined) return '—';
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
  
    getBooleanTags(prop: Property): string[] {
      const tags: string[] = [];
      if (prop.parqueadero) tags.push('Parqueadero');
      if (prop.balcon) tags.push('Balcón');
      if (prop.terraza) tags.push('Terraza');
      if (prop.patio) tags.push('Patio');
      if (prop.cuarto_util) tags.push('Cuarto útil');
      if (prop.zona_ropa) tags.push('Zona ropa');
      if (prop.alcoba_servicio) tags.push('Alcoba servicio');
      if (prop.solar) tags.push('Solar');
      if (prop.sotano) tags.push('Sótano');
      if (prop.gas) tags.push('Gas');
      if (prop.calentador) tags.push('Calentador');
      if (prop.luz_trifilar) tags.push('Luz trifilar');
      return tags;
    }
  
    getZonaSocialLabel(value: string): string {
      return this.TIPO_ZONA_SOCIAL_OPTIONS.find(o => o.value === value)?.label ?? value;
    }
  
    getCocinaLabel(value: string): string {
      return this.TIPO_COCINA_OPTIONS.find(o => o.value === value)?.label ?? value;
    }
  
    getPisoLabel(value: string): string {
      return this.TIPO_PISO_OPTIONS.find(o => o.value === value)?.label ?? value;
    }
  
    /**
     * Bug #10 resuelto: Compara con === null/undefined en vez de !id
     */
    getTeamMemberDisplay(id: number | null): string {
      if (id === null || id === undefined) return '—';
      const m = this.teamMembers().find(t => t.id === id);
      if (!m) return '—';
      const full = `${m.first_name} ${m.last_name}`.trim();
      return full || m.username;
    }
  
  
    private handleError(err: any, fallback: string): void {
      let msg = fallback;
      if (err?.error) {
        if (err.error.codigo) {
          msg = 'Ya existe una propiedad con este código en su compañía.';
        } else if (err.error.propietarios_ids) {
          msg = 'Uno o más propietarios no son válidos.';
        } else if (typeof err.error === 'object') {
          const firstKey = Object.keys(err.error)[0];
          if (firstKey) {
            const val = err.error[firstKey];
            msg = Array.isArray(val) ? val[0] : String(val);
          }
        }
      }
      this.toast.error(msg);
    }
  }