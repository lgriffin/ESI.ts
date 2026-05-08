export interface EsiResponseMeta {
  headers: Record<string, string>;
  fromCache: boolean;
  stale: boolean;
  warning?: { code: number; message: string };
  requestId?: string;
  date?: string;
  contentLanguage?: string;
}

export interface EsiResponse<T> {
  data: T;
  meta: EsiResponseMeta;
}
