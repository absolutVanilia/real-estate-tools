import { Component, Input } from '@angular/core';
import { LucideRefreshCw } from '@lucide/angular';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [LucideRefreshCw],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss',
})
export class LoadingStateComponent {
  @Input() message: string = 'Cargando...';
}