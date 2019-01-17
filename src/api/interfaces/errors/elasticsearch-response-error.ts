export interface IESResponseError {
  msg: string;
  path: string;
  query: any;
  body: string;
  statusCode: number;
  response: string;
}