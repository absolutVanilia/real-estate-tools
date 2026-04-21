import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/api/contracts`;

export interface Person {
  nombreCompleto: string;
  tipoDocumento: string;
  documento: string;
}

export interface GenerateContractRequest {
  template: string;
  contractNumber?: string;
  contractDate?: string;
  persons: Person[];
}

@Injectable({ providedIn: 'root' })
export class ContractService {
  constructor(private http: HttpClient) {}

  generateContract(data: GenerateContractRequest): Observable<Blob> {
    return this.http.post(
      `${API_URL}/generate/`,
      data,
      { responseType: 'blob' as 'json' }
    ) as Observable<Blob>;
  }
}