declare module 'mammoth/mammoth.browser' {
  export interface ConvertToHtmlResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface ConvertOptions {
    buffer?: Buffer;
    path?: string;
    arrayBuffer?: ArrayBuffer;
  }

  export function convertToHtml(options: ConvertOptions): Promise<ConvertToHtmlResult>;
  
  export function extractRawText(options: ConvertOptions): Promise<{ value: string }>;
}
