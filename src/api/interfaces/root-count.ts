export interface RootCount<CountOptions extends object = {}> {
  count(options: CountOptions): Promise<number>;
}
