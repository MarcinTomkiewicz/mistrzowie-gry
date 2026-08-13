export interface ISessionListAction {
  type: 'action' | 'edit' | 'delete';
  label?: string;
  severity?: 'secondary' | 'success' | 'danger';
  outlined?: boolean;
  icon?: string;
}
