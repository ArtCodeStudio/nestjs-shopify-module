export interface ChildCount<CountOptions extends object = {}> {
  count(parentId: number, options: CountOptions): Promise<number>;
}