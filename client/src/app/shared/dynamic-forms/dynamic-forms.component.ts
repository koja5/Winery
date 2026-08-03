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
import { FieldConfig, ComboboxOption } from '../../core/models/field-config';
import { FieldType } from '../../core/enums/field-type.enum';
import { CallApiService } from '../../core/services/call-api.service';

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
  private api = inject(CallApiService);
  form: FormGroup = this.fb.group({});

  /** resolved options for combobox fields whose options come from `field.request`
   *  instead of a static list — response rows are mapped {id,name} -> {value,text}. */
  fieldOptions: Record<string, ComboboxOption[]> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['data']) {
      this.buildForm();
      this.loadRequestOptions();
    }
  }

  optionsFor(field: FieldConfig): ComboboxOption[] {
    return this.fieldOptions[field.name] || field.options || [];
  }

  private loadRequestOptions(): void {
    for (const field of this.fields) {
      if (field.type === FieldType.Combobox && field.request && !this.fieldOptions[field.name]) {
        this.api.call<any[]>(field.request).subscribe((rows) => {
          this.fieldOptions[field.name] = (rows || []).map((row) => ({ text: row.name, value: row.id }));
        });
      }
    }
  }

  private buildForm(): void {
    const group: Record<string, any> = {};
    for (const field of this.fields) {
      let value = this.data ? this.data[field.name] : null;
      if (field.type === FieldType.Date && typeof value === 'string') {
        value = new Date(value);
      }
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
    this.save.emit(this.serializeDates(this.form.getRawValue()));
  }

  /** Date objects JSON-serialize via toISOString(), which shifts to UTC and
   *  can roll the calendar day back a day for any timezone ahead of UTC —
   *  send local YYYY-MM-DD instead so the picked day is what the server gets. */
  private serializeDates(value: Record<string, any>): Record<string, any> {
    const out = { ...value };
    for (const field of this.fields) {
      if (field.type === FieldType.Date && out[field.name] instanceof Date) {
        const d: Date = out[field.name];
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        out[field.name] = `${year}-${month}-${day}`;
      }
    }
    return out;
  }
}
