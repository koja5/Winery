import { FieldType } from '../enums/field-type.enum';
import { RequestModel } from './request-model';

export interface ComboboxOption {
  text: string;
  value: string | number;
}

export interface FieldConfig {
  type: FieldType;
  name: string;
  title: string;
  width?: string;
  required?: boolean;
  readonly?: boolean;
  /** becomes readonly once editing an existing row (e.g. can't change grape variety after pressing) */
  disabledOnEdit?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  /** static options for a combobox, or a request that fetches them */
  options?: ComboboxOption[];
  request?: RequestModel;
}
