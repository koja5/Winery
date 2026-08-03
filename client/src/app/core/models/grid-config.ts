import { ColumnConfig } from './column-config';
import { FieldConfig } from './field-config';
import { RequestModel } from './request-model';

/**
 * A single JSON file drives both the grid (columns + list request) and the
 * paired create/edit dialog (fields + save/delete requests) — one config per
 * entity, no bespoke component needed to add a new grid.
 */
export interface GridConfig {
  name: string;
  dataKey: string;
  request: RequestModel;
  columns: ColumnConfig[];
  /** paired create/edit form; omit for read-only grids */
  fields?: FieldConfig[];
  save?: RequestModel;
  delete?: RequestModel;
  dialogTitleCreate?: string;
  dialogTitleEdit?: string;
}
