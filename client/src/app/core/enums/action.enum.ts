export enum Action {
  Edit = 'edit',
  Delete = 'delete',
  Preview = 'preview',
  Emit = 'emit'
}

export const DANGER_ACTIONS = new Set<Action>([Action.Delete]);
