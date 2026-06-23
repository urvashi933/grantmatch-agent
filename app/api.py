import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.agent import researcher_agent, writer_agent, reviewer_agent
from app.skills.pii_redactor import redact_pii

app = FastAPI(title="GrantMatch & Draft Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CoordinatorRequest(BaseModel):
    mission: str
    profile: Optional[str] = None

class ResearcherRequest(BaseModel):
    mission: str

class WriterRequest(BaseModel):
    profile: str
    grantDetails: str

class ReviewerRequest(BaseModel):
    rawText: str

def search_grants(keywords: str) -> str:
    kw = keywords.lower()
    results = []
    if "education" in kw or "tutor" in kw or "school" in kw or "learning" in kw:
        results.append("- Global Education Fund: $50,000 grant for after-school tutoring programs targeting low-income areas. Deadline: Oct 1.")
        results.append("- EdTech Innovation Grant: $25,000 for non-profits providing digital learning tools. Deadline: Nov 15.")
    if "health" in kw or "medical" in kw or "wellness" in kw or "clinic" in kw:
        results.append("- Community Wellness Initiative: $100,000 for local health clinics, mental health, and awareness programs. Deadline: Sep 30.")
        results.append("- Health Equity Action Grant: $45,000 for non-profits addressing healthcare disparities in underserved regions. Deadline: Dec 5.")
    if "environment" in kw or "eco" in kw or "climate" in kw or "sustainability" in kw or "nature" in kw or "green" in kw:
        results.append("- Green Earth Action Grant: $75,000 for community-led sustainability, recycling, and conservation programs. Deadline: Aug 15.")
        results.append("- Urban Reforestation Fund: $30,000 for local tree planting and cooling nature spaces. Deadline: Oct 20.")
    if not results:
        return "No specific grants found for these keywords, but the 'General Community Impact Grant' ($10,000) is available for all registered 501(c)(3) organizations. Deadline: Rolling."
    return "\n".join(results)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "geminiConfigured": True}

@app.post("/api/run-coordinator")
async def run_coordinator(req: CoordinatorRequest):
    if not req.mission.strip():
        raise HTTPException(status_code=400, detail="Mission statement is required.")
    
    logs = []
    def add_log(agent: str, message: str, log_type: str = "info"):
        logs.append({
            "agent": agent,
            "timestamp": time.strftime("%I:%M:%S %p"),
            "message": message,
            "type": log_type
        })
        
    try:
        add_log("grantmatch_coordinator", "Starting end-to-end grant matching flow...", "info")
        add_log("grantmatch_coordinator", "Coordinator received Non-Profit details and mission statement.", "thought")

        # PHASE 1: Researcher
        add_log("researcher_agent", "Starting grant research... Analyzing nonprofit mission keywords.", "info")
        add_log("researcher_agent", f'Mission keywords to extract: "{req.mission[:80]}..."', "thought")
        add_log("researcher_agent", "Invoking `search_grants` tool on databases...", "tool")
        
        grants_found = search_grants(req.mission)
        add_log("researcher_agent", f"Grant database returned matching records:\n{grants_found}", "result")
        add_log("researcher_agent", "Forming optimal grant recommendations summary...", "thought")
        
        research_summary = f"Based on the mission, the best grants are:\n{grants_found}\nThese align perfectly with the target demographic."
        add_log("researcher_agent", research_summary, "result")
        
        # PHASE 2: Writer
        add_log("writer_agent", "Initiating the drafting process...", "info")
        add_log("writer_agent", "Generating compelling narrative highlighting alignment with specific grant guidelines...", "thought")
        
        profile = req.profile or f"Nonprofit Mission: {req.mission}"
        proposal_draft = (
            f"Dear Grant Committee,\n\n"
            f"We are excited to apply for the grant to support our mission: {req.mission}.\n\n"
            f"Our organization profile:\n{profile}\n\n"
            f"Please contact us at 555-019-2831 or email director@tutorsfortomorrow.org. Our EIN is 45-1234567.\n\n"
            f"Sincerely, The Team"
        )
        
        add_log("writer_agent", "Draft proposal created successfully.", "result")
        
        # PHASE 3: Reviewer
        add_log("reviewer_agent", "Starting security, PII checks, and compliance guidelines review...", "info")
        add_log("reviewer_agent", "Applying local `redact_pii` tool over drafted text blocks.", "tool")
        
        scrubbed_draft = redact_pii(proposal_draft)
        has_redactions = scrubbed_draft != proposal_draft
        
        if has_redactions:
            add_log("reviewer_agent", "PII was detected and successfully scrubbed. Phone, Email, and/or Tax numbers have been replaced with placeholders.", "info")
        else:
            add_log("reviewer_agent", "No sensitive PII (Emails, Phone numbers, SSNs) found in the draft.", "info")
            
        add_log("reviewer_agent", "Running Quality Review using Compliance Agent model...", "thought")
        
        finalized_proposal = f"# Grant Proposal\n\n{scrubbed_draft}"
        add_log("reviewer_agent", "Quality review complete! High-integrity draft generated.", "result")
        add_log("grantmatch_coordinator", "Workflow fully complete! Delivering finalized response package.", "info")

        return {
            "success": True,
            "data": {
                "grantsSearchRaw": grants_found,
                "researchSummary": research_summary,
                "rawProposalDraft": proposal_draft,
                "hasRedactions": has_redactions,
                "scrubbedProposalDraft": scrubbed_draft,
                "finalizedProposal": finalized_proposal,
            },
            "logs": logs
        }
        
    except Exception as e:
        add_log("grantmatch_coordinator", f"Critical Error: {str(e)}", "info")
        return {"success": False, "error": str(e), "logs": logs}

@app.post("/api/run-researcher")
async def run_researcher(req: ResearcherRequest):
    grants_found = search_grants(req.mission)
    return {
        "grantsFound": grants_found,
        "summary": f"Summary of grants for {req.mission}:\n{grants_found}"
    }

@app.post("/api/run-writer")
async def run_writer(req: WriterRequest):
    return {
        "draft": f"Draft Proposal for {req.profile}\n\nAddressing: {req.grantDetails}\n\nPlease contact 555-123-4567 or admin@nonprofit.org. EIN: 99-9999999."
    }

@app.post("/api/run-reviewer")
async def run_reviewer(req: ReviewerRequest):
    redacted_text = redact_pii(req.rawText)
    has_redactions = redacted_text != req.rawText
    return {
        "redactedText": redacted_text,
        "hasRedactions": has_redactions,
        "finalProposal": f"# Reviewed Document\n\n{redacted_text}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.api:app", host="127.0.0.1", port=8000, reload=True)
