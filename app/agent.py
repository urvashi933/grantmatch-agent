"""
GrantMatch Agent — Multi-Agent Orchestration via Google ADK

Architecture:
  Coordinator (root_agent)
    ├── Researcher Agent  →  search_grants tool (via MCP Server)
    ├── Writer Agent      →  LLM-only (Gemini generates proposals)
    └── Reviewer Agent    →  redact_pii tool (local regex security)

The coordinator delegates tasks to sub-agents using ADK's native
multi-agent delegation pattern. Each sub-agent has specialized
instructions and tools for its role in the grant matching pipeline.
"""

import os
import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.adk.tools.mcp_tool import MCPTool, MCPToolset, StdioServerParameters
from google.genai import types

# Import the direct PII redactor skill (local security boundary)
from app.skills.pii_redactor import redact_pii

# Authenticate GCP
try:
    _, project_id = google.auth.default()
    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
    os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"
except Exception:
    pass

# Shared model configuration — uses Gemini Flash for speed
model_config = Gemini(
    model="gemini-flash-latest",
    retry_options=types.HttpRetryOptions(attempts=3),
)

# --------------------------------------------------------------------------
# MCP Tool: Connect Researcher to our MCP grant-search server
# The MCP server exposes `search_grants` as a protocol-compliant tool.
# --------------------------------------------------------------------------
mcp_grant_search = MCPToolset(
    connection_params=StdioServerParameters(
        command="uv",
        args=["run", "python", "-m", "app.mcp_server"],
    ),
)

# --------------------------------------------------------------------------
# 1. Researcher Agent — finds matching grant opportunities
# --------------------------------------------------------------------------
researcher_agent = Agent(
    name="researcher_agent",
    model=model_config,
    description="Finds relevant grant opportunities based on a non-profit's mission.",
    instruction="""You are an expert Grant Researcher specializing in non-profit funding.

Given a description of a non-profit organization's mission, use the `search_grants`
tool to find matching grant opportunities from the database.

After receiving results, provide a clear summary that:
1. Lists each matching grant with its name, amount, and deadline
2. Explains WHY each grant is a good fit for the organization's specific mission
3. Recommends which grant to prioritize based on alignment and amount

Always use the search_grants tool — never make up grant opportunities.""",
    tools=[mcp_grant_search],
)

# --------------------------------------------------------------------------
# 2. Writer Agent — drafts compelling grant proposals (LLM-only)
# --------------------------------------------------------------------------
writer_agent = Agent(
    name="writer_agent",
    model=model_config,
    description="Drafts a persuasive grant proposal combining the organization's profile with grant details.",
    instruction="""You are an expert Grant Writer with experience in non-profit fundraising.

Write a compelling, professional grant proposal that includes:
1. A strong opening paragraph establishing the organization's mission and impact
2. A detailed middle section explaining how the grant funds will be used,
   with specific programs, goals, and expected outcomes
3. A closing paragraph reinforcing the organization's qualifications and
   expressing commitment to the grant's objectives

Guidelines:
- Be specific and data-driven where possible
- Match the proposal tone to the grant's requirements
- Include the organization's contact details as provided in the profile
- Keep the proposal between 300-500 words
- Use professional, persuasive language""",
    tools=[],
)

# --------------------------------------------------------------------------
# 3. Reviewer Agent — security compliance and PII scrubbing
# --------------------------------------------------------------------------
reviewer_agent = Agent(
    name="reviewer_agent",
    model=model_config,
    description="Reviews proposals for quality and redacts any sensitive PII before final delivery.",
    instruction="""You are a Compliance and Security Reviewer for grant proposals.

Your responsibilities:
1. ALWAYS run the `redact_pii` tool on the proposal text to scrub sensitive information
   (emails, phone numbers, SSNs, tax IDs)
2. Review the proposal for professional quality and completeness
3. Format the final output as clean Markdown with proper headings

Security is non-negotiable: you MUST run redact_pii on every proposal before approving it.
Return the final scrubbed and formatted proposal.""",
    tools=[redact_pii],
)

# --------------------------------------------------------------------------
# Root Coordinator Agent — orchestrates the full pipeline
# --------------------------------------------------------------------------
root_agent = Agent(
    name="grantmatch_coordinator",
    model=model_config,
    description="Coordinates the end-to-end grant matching and proposal generation pipeline.",
    instruction="""You are the GrantMatch Coordinator — the lead orchestrator of a
multi-agent grant matching system for non-profit organizations.

Your workflow has three phases. You MUST delegate to your sub-agents in this exact order:

**Phase 1 — Research:** Transfer to `researcher_agent` with the organization's mission
description. The researcher will search the grant database and return matching opportunities.

**Phase 2 — Writing:** Transfer to `writer_agent` with the organization's full profile
AND the grant details from Phase 1. The writer will draft a compelling proposal.

**Phase 3 — Review:** Transfer to `reviewer_agent` with the draft proposal from Phase 2.
The reviewer will scrub PII and ensure compliance before delivering the final proposal.

After all three phases complete, compile and return the full results to the user including:
- The grants found
- The raw draft proposal
- The final scrubbed proposal

Always follow this three-phase pipeline. Never skip a phase.""",
    sub_agents=[researcher_agent, writer_agent, reviewer_agent],
)

# --------------------------------------------------------------------------
# ADK Application entry point
# --------------------------------------------------------------------------
app = App(
    root_agent=root_agent,
    name="grantmatch_app",
)
