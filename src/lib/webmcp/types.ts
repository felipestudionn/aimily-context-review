export interface WebMcpExecuteOptions {
  signal: AbortSignal;
}

export interface WebMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {readOnlyHint: boolean; untrustedContentHint: boolean};
  execute: (input: Record<string, unknown>, options: WebMcpExecuteOptions) => Promise<unknown>;
}

export interface WebMcpModelContext {
  registerTool(tool: WebMcpTool, options?: {signal?: AbortSignal; exposedTo?: string[]}): Promise<void>;
}

export type WebMcpDocument = Document & {modelContext?: WebMcpModelContext};
export type WebMcpRegistrationStatus = 'unsupported' | 'registering' | 'ready' | 'error';
