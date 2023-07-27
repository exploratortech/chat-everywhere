export interface CommandResult<T = any> {
  data?: T;
  message: string;
  error?: boolean;
}
