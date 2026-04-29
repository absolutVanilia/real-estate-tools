import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

import {
  LucideCircleCheck,
  LucideCircleX,
  LucideTriangleAlert,
  LucideInfo,
  LucideX,
} from '@lucide/angular';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [
    LucideCircleCheck,
    LucideCircleX,
    LucideTriangleAlert,
    LucideInfo,
    LucideX,
  ],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent {
  protected toastService = inject(ToastService);
  protected toasts = this.toastService.toasts;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}