export interface RootCount<CountOptions> {
  count(options: CountOptions): Promise<number>;
}
