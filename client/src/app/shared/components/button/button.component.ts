import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonImpact = 'bold' | 'outline' | 'ghost';
export type ButtonTone = 'primary' | 'light' | 'danger';
export type ButtonShape = 'rounded' | 'pill' | 'square';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class AppButtonComponent {
  @Input() impact: ButtonImpact = 'bold';
  @Input() tone: ButtonTone = 'primary';
  @Input() shape: ButtonShape = 'rounded';
  @Input() size: ButtonSize = 'medium';
  @Input({ transform: booleanAttribute }) full = false;
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() type: 'button' | 'submit' = 'button';

  get classes(): string {
    return [
      'app-button',
      `app-button--${this.impact}`,
      `app-button--${this.tone}`,
      `app-button--${this.shape}`,
      `app-button--${this.size}`,
      this.full ? 'app-button--full' : ''
    ]
      .filter(Boolean)
      .join(' ');
  }
}
