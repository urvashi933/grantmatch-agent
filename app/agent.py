import os
import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

# Import custom skills
from app.skills.grant_search import search_grants
from app.skills.pii_redactor import redact_pii

# Authenticate GCP
try:
    _, project_id = google.auth.default()
    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
    os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"
except Exception:
    pass

# Shared model config
model_config = Gemini(
    model="gemini-flash-latest",
    retry_options=types.HttpRetryOptions(attempts=3),
)

# 1. Researcher Agent
researcher_agent = Agent(
    name="researcher_agent",
    model=model_config,
    description="Finds relevant grant opportunities based on a non-profit's mission.",
    instruction="""You are an expert Grant Researcher.
    Given a description of a non-profit organization's mission, use the `search_grants` tool to find matching opportunities.
    Extract the key details of the grants found and return a clear summary.""",
    tools=[search_grants],
)

# 2. Writer Agent
writer_agent = Agent(
    name="writer_agent",
    model=model_config,
    description="Drafts a grant proposal combining the non-profit's profile with the grant details.",
    instruction="""You are an expert Grant Writer.
    Write a compelling, professional 3-paragraph grant proposal draft.
    You will receive the non-profit's profile and the grant details.
    Ensure you explicitly mention why the non-profit is a perfect fit for the specific grant requirements.""",
    tools=[],
)

# 3. Reviewer Agent (Security/Compliance)
reviewer_agent = Agent(
    name="reviewer_agent",
    model=model_config,
    description="Reviews the drafted grant proposal, ensures it is high quality, and redacts any sensitive PII.",
    instruction="""You are a Compliance and Security Reviewer for grant proposals.
    You must always run the `redact_pii` tool on the final drafted text before approving it.
    If the text looks good and PII is redacted, return the final scrubbed proposal.""",
    tools=[redact_pii],
)

def run_researcher(mission: str) -> str:
    """Calls the researcher agent to find grants."""
    # Assuming standard ADK run syntax
    return "Researcher output" # Dummy for now if not running live

def run_writer(context: str) -> str:
    """Calls the writer agent."""
    return "Writer output"

def run_reviewer(draft: str) -> str:
    """Calls the reviewer agent."""
    return "Reviewer output"

# Root Coordinator Agent
root_agent = Agent(
    name="grantmatch_coordinator",
    model=model_config,
    description="Coordinates the grant research, writing, and reviewing process.",
    instruction="""You are the GrantMatch Coordinator.
    Your job is to manage the end-to-end grant application process for non-profits.
    
    Steps:
    1. Send the non-profit's mission to the `run_researcher` tool to find grants.
    2. Pass the selected grant and the non-profit's profile to the `run_writer` tool to draft the proposal.
    3. Pass the drafted proposal to the `run_reviewer` tool to scrub PII and finalize it.
    
    Return the final reviewed and scrubbed proposal to the user.""",
    tools=[run_researcher, run_writer, run_reviewer],
)

app = App(
    root_agent=root_agent,
    name="grantmatch_app",
)
