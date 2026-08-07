import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { FieldConfig, ComboboxOption } from '../../core/models/field-config';
import { FieldType } from '../../core/enums/field-type.enum';
import { CallApiService } from '../../core/services/call-api.service';
import { ConfigurationService } from '../../core/services/configuration.service';
import { GridConfig } from '../../core/models/grid-config';

/** Sentinel option value rendered as the trailing "+ Dodaj novo..." row on
 *  any combobox with `allowCreate: true` — intercepted in onSelectChange
 *  before it ever reaches the form control. */
const ADD_NEW_VALUE = '__add_new__';

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
    ToggleSwitchModule,
    ButtonModule,
    TextareaModule,
    DialogModule,
    DynamicFormsComponent
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
  readonly ADD_NEW_VALUE = ADD_NEW_VALUE;

  private fb = inject(FormBuilder);
  private api = inject(CallApiService);
  private configService = inject(ConfigurationService);
  form: FormGroup = this.fb.group({});

  /** resolved options for combobox fields whose options come from `field.request`
   *  instead of a static list — response rows are mapped {id,name} -> {value,text}. */
  fieldOptions: Record<string, ComboboxOption[]> = {};

  // "Quick add" dialog state: lets any request-backed combobox create a new
  // referenced record inline (e.g. picking a Posuda without leaving the
  // Fermentacija form) via a nested instance of this same component, built
  // from the target entity's own grid config (fields + save request).
  createDialogVisible = false;
  createField: FieldConfig | null = null;
  createConfig: GridConfig | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['data']) {
      this.buildForm();
      this.loadRequestOptions();
    }
  }

  optionsFor(field: FieldConfig): ComboboxOption[] {
    const base = this.fieldOptions[field.name] || field.options || [];
    if (field.allowCreate && field.request) {
      return [...base, { text: 'general.addNewOption', value: ADD_NEW_VALUE }];
    }
    return base;
  }

  onSelectChange(field: FieldConfig, event: { value: any }): void {
    if (event.value !== ADD_NEW_VALUE) return;
    this.form.get(field.name)?.setValue(null);
    this.createField = field;
    this.configService.getGridConfig('grids/admin', field.createConfigFile!).subscribe((config) => {
      this.createConfig = config;
      this.createDialogVisible = true;
    });
  }

  onCreateSave(value: Record<string, any>): void {
    const field = this.createField;
    const config = this.createConfig;
    if (!field || !config?.save) return;

    this.api.call<{ id: string }>(config.save, value).subscribe((res) => {
      this.createDialogVisible = false;
      this.api.call<any[]>(field.request!).subscribe((rows) => {
        this.fieldOptions[field.name] = (rows || []).map((row) => ({ text: row.name, value: row.id }));
        this.form.get(field.name)?.setValue(res?.id ?? null);
      });
      this.createField = null;
      this.createConfig = null;
    });
  }

  onCreateCancel(): void {
    this.createDialogVisible = false;
    this.createField = null;
    this.createConfig = null;
  }

  /** Percentage widths in a flex row fight with `gap` (flexbox doesn't
   *  exclude gap from % math, so 48%+48% either overflows into a wrap or,
   *  with flex-grow, un-wraps everything onto one line). A 24-unit CSS grid
   *  sidesteps both: `gap` is a first-class part of grid track sizing, and
   *  fields wrap to a new row exactly when their spans fill the 24 columns
   *  (e.g. 48%+48% → 12+12, 70%+28% → 17+7), always reaching the same right
   *  edge as a full-width field. */
  fieldSpan(field: FieldConfig): number {
    const width = field.width || '100%';
    if (width === '100%') {
      return 24;
    }
    const pct = parseFloat(width) || 100;
    return Math.max(1, Math.min(24, Math.round((pct / 100) * 24)));
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
