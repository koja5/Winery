import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { FieldConfig } from '../../core/models/field-config';
import { FieldType } from '../../core/enums/field-type.enum';

@Component({
  selector: 'app-dynamic-forms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    ButtonModule
  ],
  templateUrl: './dynamic-forms.component.html',
  styleUrl: './dynamic-forms.component.scss'
})
export class DynamicFormsComponent implements OnChanges {
  @Input() fields: FieldConfig[] = [];
  @Input() data: Record<string, any> | null = null;
  @Input() isEdit = false;
  @Output() save = new EventEmitter<Record<string, any>>();
  @Output() cancel = new EventEmitter<void>();

  readonly FieldType = FieldType;

  private fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['data']) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    const group: Record<string, any> = {};
    for (const field of this.fields) {
      const value = this.data ? this.data[field.name] : null;
      const disabled = field.readonly || (field.disabledOnEdit && this.isEdit);
      group[field.name] = [
        { value: value ?? null, disabled: !!disabled },
        field.required ? Validators.required : []
      ];
    }
    this.form = this.fb.group(group);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }
}
