import { ColumnType } from '../enums/column-type.enum';
import { Action } from '../enums/action.enum';
import { RequestModel } from './request-model';

export interface ActionDef {
  type: Action;
  icon: string;
  title: string;
  tooltip?: string;
  request?: RequestModel;
  confirmRequired?: boolean;
  confirmMessage?: string;
  /** identifies this action for Action.Emit — the host page switches on it */
  key?: string;
}

export interface ColumnConfig {
  title: string;
  field: string;
  type?: ColumnType;
  width?: string;
  sortable?: boolean;
  filter?: boolean;
  format?: string;
  /** raw value -> i18n key remap, e.g. { in_progress: 'status.inProgress' } */
  translateMap?: Record<string, string>;
  /** marks this column as the row-action kebab source instead of a data column */
  actions?: ActionDef[];
}
