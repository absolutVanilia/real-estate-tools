import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ContractService } from '../../services/contract.service';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contratos.component.html',
  styleUrl: './contratos.component.scss'
})
export class ContratosComponent {
  templates = ['Bello', 'Medellin'];
  documentTypes = ['Cedula de ciudadania', 'Tarjeta de identidad', 'Pasaporte', 'Nit'];
  selectedTemplate = '';
  isSubmitting = false;
  message = '';
  personsForm: FormGroup;

  constructor(
    private contractService: ContractService,
    private fb: FormBuilder
  ) {
    this.personsForm = this.fb.group({
      contractNumber: [''],
      contractDate: [this.getTodayDate()],
      persons: this.fb.array([this.createPersonGroup()])
    });
  }

  get persons(): FormArray {
    return this.personsForm.get('persons') as FormArray;
  }

  getTodayDate(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  
    return formatter.format(new Date());
  }
  
  createPersonGroup(): FormGroup {
    return this.fb.group({
      nombreCompleto: [''],
      tipoDocumento: [''],
      documento: [''],  
      lugarExpedicion: ['']
    });
  }

  addPerson(): void {
    this.persons.push(this.createPersonGroup());
  }

  removePerson(index: number): void {
    if (this.persons.length > 1) {
      this.persons.removeAt(index);
    }
  }

  onSubmit(): void {
    if (!this.selectedTemplate) return;
  
    this.isSubmitting = true;
    this.message = '';
  
    const persons = this.persons.value;
  
    this.contractService.generateContract({
      template: this.selectedTemplate,
      contractNumber: this.personsForm.value.contractNumber,
      contractDate: this.personsForm.value.contractDate,
      persons
    }).subscribe({
      next: (blob: Blob) => {
    
        const url = window.URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contract.docx';
    
        document.body.appendChild(a);
        a.click();
        a.remove();
    
        window.URL.revokeObjectURL(url);
    
        this.isSubmitting = false;
      },
      error: (error: any) => {
        this.message = 'Error generating contract: ' + error.message;
        this.isSubmitting = false;
      }
    });
  }
}
