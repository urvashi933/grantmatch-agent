export interface Log {
  agent: string;
  timestamp: string;
  message: string;
  type: "info" | "tool" | "thought" | "result";
}

export interface GrantMatchResult {
  grantsSearchRaw: string;
  researchSummary: string;
  rawProposalDraft: string;
  hasRedactions: boolean;
  scrubbedProposalDraft: string;
  finalizedProposal: string;
}

export interface CoordinatorResponse {
  success: boolean;
  data?: GrantMatchResult;
  logs?: Log[];
  error?: string;
}

export interface InvestigatorResult {
  grantsFound: string;
  summary: string;
}

export interface WriterResult {
  draft: string;
}

export interface ReviewerResult {
  redactedText: string;
  hasRedactions: boolean;
  finalProposal: string;
}
