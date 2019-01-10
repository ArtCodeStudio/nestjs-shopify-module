export interface IListAllCallbackData<T> {
  pages: number;
  page: number;
  data: T;
}

export type listAllCallback<T> = (error: Error, data: IListAllCallbackData<T>) => void;
