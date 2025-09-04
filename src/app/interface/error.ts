export interface IErrorSource {
  path: string;
  message: string;
}

export type IErrorSources = IErrorSource[];

export interface IGenericErrorRes {
  statusCode: number;
  message: string;
  errorSources: IErrorSources;
}
