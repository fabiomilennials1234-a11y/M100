export interface SummaryPort {
  generateProgressiveSummary(conversationId: string): Promise<string>;
  generateFinalSummary(conversationId: string): Promise<string>;
}
