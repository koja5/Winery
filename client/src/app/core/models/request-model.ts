export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Generic description of a server call, reused everywhere a config needs to
 * describe "fetch this grid" / "save this row" / "delete this row" / "load
 * these combobox options" without a bespoke TS method per entity.
 */
export interface RequestModel {
  type: HttpVerb;
  api: string;
  /** route params substituted into `api`, e.g. "/api/admin/wine-vessels/:id" */
  parameters?: string[];
  /** subset of fields from the form value to send in the body */
  fields?: string[];
  /** property to unwrap from the response, e.g. "data" */
  root?: string;
}
