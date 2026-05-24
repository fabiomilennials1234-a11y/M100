export interface SanitizationResult {
  sanitized: string;
  piiRedacted: boolean;
  injectionFlagged: boolean;
  flags: string[];
}

export interface ValidationResult {
  valid: boolean;
  action: 'pass' | 'handoff';
  reason?: string;
}

export interface ToolInterceptionResult {
  allowed: boolean;
  reason?: string;
}

export interface ApprovalContext {
  conversationId: string;
  action: string;
  details: Record<string, unknown>;
}

export interface ApprovalResult {
  approved: boolean;
  reason?: string;
  modifiedContent?: string;
}

export interface GuardrailPort {
  sanitizeInput(content: string): SanitizationResult;
  validateOutput(content: string): ValidationResult;
  interceptToolCall(toolName: string, args: Record<string, unknown>): ToolInterceptionResult;
  requestHumanApproval(context: ApprovalContext): Promise<ApprovalResult>;
}
