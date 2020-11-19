export interface ChildCount<CountOptions> {
  count(parentId: number, options: CountOptions): Promise<number>;
}