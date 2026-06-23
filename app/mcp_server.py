"""
GrantMatch MCP Server — Model Context Protocol server for grant search.

This module exposes the `search_grants` tool via MCP protocol,
enabling any MCP-compatible agent to discover and invoke grant search
functionality through a standardized interface.

Run standalone: python -m app.mcp_server
Used by ADK: Connected via MCPToolset with StdioServerParameters
"""

import json
from mcp.server.fastmcp import FastMCP

# Initialize MCP server
mcp = FastMCP(
    "GrantMatch Grant Search Server",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Grant Database — structured records with rich metadata
# ---------------------------------------------------------------------------
GRANT_DATABASE = [
    # Education grants
    {
        "name": "Global Education Fund",
        "amount": "$50,000",
        "category": "education",
        "deadline": "October 1, 2025",
        "eligibility": "501(c)(3) organizations providing K-12 educational programs",
        "description": "Supports after-school tutoring programs targeting low-income areas with measurable learning outcomes.",
        "keywords": ["education", "tutoring", "school", "k-12", "learning", "students", "literacy"],
    },
    {
        "name": "EdTech Innovation Grant",
        "amount": "$25,000",
        "category": "education",
        "deadline": "November 15, 2025",
        "eligibility": "Non-profits providing digital learning tools or STEM education",
        "description": "Funds technology-driven educational initiatives including digital classrooms, coding bootcamps, and adaptive learning platforms.",
        "keywords": ["education", "technology", "digital", "stem", "edtech", "learning", "coding"],
    },
    {
        "name": "Youth Literacy Alliance Grant",
        "amount": "$35,000",
        "category": "education",
        "deadline": "December 1, 2025",
        "eligibility": "Organizations focused on childhood literacy in underserved communities",
        "description": "Supports reading programs, library access, and literacy coaching for children ages 5-14.",
        "keywords": ["literacy", "reading", "children", "youth", "education", "books"],
    },
    # Health grants
    {
        "name": "Community Wellness Initiative",
        "amount": "$100,000",
        "category": "health",
        "deadline": "September 30, 2025",
        "eligibility": "Community health organizations with established clinics or outreach programs",
        "description": "Funds local health clinics, mental health services, and community wellness awareness programs.",
        "keywords": ["health", "wellness", "clinic", "medical", "mental health", "community"],
    },
    {
        "name": "Health Equity Action Grant",
        "amount": "$45,000",
        "category": "health",
        "deadline": "December 5, 2025",
        "eligibility": "Non-profits addressing healthcare disparities in underserved regions",
        "description": "Targets healthcare access gaps including telehealth, mobile clinics, and preventive care programs.",
        "keywords": ["health", "equity", "disparities", "access", "medical", "telehealth", "preventive"],
    },
    {
        "name": "Rural Health Outreach Fund",
        "amount": "$60,000",
        "category": "health",
        "deadline": "January 15, 2026",
        "eligibility": "Organizations serving rural populations with limited healthcare access",
        "description": "Supports mobile health units, community health workers, and rural clinic operations.",
        "keywords": ["health", "rural", "outreach", "clinic", "community", "mobile"],
    },
    # Environment grants
    {
        "name": "Green Earth Action Grant",
        "amount": "$75,000",
        "category": "environment",
        "deadline": "August 15, 2025",
        "eligibility": "Community-led environmental organizations with conservation programs",
        "description": "Funds sustainability, recycling, conservation, and environmental education programs.",
        "keywords": ["environment", "sustainability", "conservation", "recycling", "eco", "climate", "green"],
    },
    {
        "name": "Urban Reforestation Fund",
        "amount": "$30,000",
        "category": "environment",
        "deadline": "October 20, 2025",
        "eligibility": "Non-profits focused on urban greening and tree-planting initiatives",
        "description": "Supports local tree planting, urban cooling corridors, and green space development.",
        "keywords": ["trees", "urban", "reforestation", "planting", "green", "nature", "environment"],
    },
    {
        "name": "Clean Water Access Initiative",
        "amount": "$90,000",
        "category": "environment",
        "deadline": "November 30, 2025",
        "eligibility": "Organizations working on clean water access and water conservation",
        "description": "Funds water purification systems, watershed conservation, and clean water access for underserved communities.",
        "keywords": ["water", "clean", "conservation", "purification", "environment", "access"],
    },
    # Social services grants
    {
        "name": "Community Resilience Fund",
        "amount": "$40,000",
        "category": "social",
        "deadline": "January 10, 2026",
        "eligibility": "Organizations providing social services, housing support, or food security programs",
        "description": "Supports community resilience through food banks, housing assistance, and social safety net programs.",
        "keywords": ["community", "social", "housing", "food", "resilience", "support", "poverty"],
    },
    {
        "name": "Arts & Culture Impact Grant",
        "amount": "$20,000",
        "category": "arts",
        "deadline": "February 1, 2026",
        "eligibility": "Non-profits using arts and culture for community development and social impact",
        "description": "Funds art therapy, cultural preservation, music education, and creative community programs.",
        "keywords": ["arts", "culture", "music", "creative", "therapy", "community", "heritage"],
    },
    {
        "name": "General Community Impact Grant",
        "amount": "$10,000",
        "category": "general",
        "deadline": "Rolling (quarterly review)",
        "eligibility": "Any registered 501(c)(3) organization",
        "description": "Open grant for community-focused non-profits that demonstrate measurable local impact.",
        "keywords": ["community", "impact", "general", "nonprofit"],
    },
]


def _score_grant(grant: dict, keywords: list[str]) -> int:
    """Score how well a grant matches the provided keywords."""
    score = 0
    for kw in keywords:
        kw_lower = kw.lower().strip()
        if not kw_lower:
            continue
        for grant_kw in grant["keywords"]:
            if kw_lower in grant_kw or grant_kw in kw_lower:
                score += 1
    return score


@mcp.tool()
def search_grants(mission_keywords: str) -> str:
    """Search the grant database for opportunities matching a non-profit's mission.

    Args:
        mission_keywords: A description or comma-separated keywords describing
                         the non-profit's mission and focus areas.

    Returns:
        A formatted string listing matching grant opportunities with details.
    """
    # Tokenize input keywords
    raw_keywords = mission_keywords.replace(",", " ").split()
    keywords = [kw.strip().lower() for kw in raw_keywords if len(kw.strip()) > 2]

    # Score each grant against keywords
    scored = []
    for grant in GRANT_DATABASE:
        score = _score_grant(grant, keywords)
        if score > 0:
            scored.append((score, grant))

    # Sort by score descending, take top 5
    scored.sort(key=lambda x: x[0], reverse=True)
    top_matches = scored[:5]

    if not top_matches:
        # Fallback: always return the general grant
        general = GRANT_DATABASE[-1]
        return (
            f"No specific grants found for keywords: {mission_keywords}\n\n"
            f"However, the following general grant is available:\n"
            f"- {general['name']}: {general['amount']} — {general['description']} "
            f"(Deadline: {general['deadline']})"
        )

    # Format results
    lines = [f"Found {len(top_matches)} matching grant(s):\n"]
    for i, (score, grant) in enumerate(top_matches, 1):
        lines.append(
            f"{i}. **{grant['name']}** — {grant['amount']}\n"
            f"   Category: {grant['category'].title()}\n"
            f"   Deadline: {grant['deadline']}\n"
            f"   Eligibility: {grant['eligibility']}\n"
            f"   Description: {grant['description']}\n"
        )

    return "\n".join(lines)


@mcp.resource("grants://database/all")
def get_all_grants() -> str:
    """Returns the full grant database as a JSON resource."""
    return json.dumps(GRANT_DATABASE, indent=2)


if __name__ == "__main__":
    mcp.run(transport="stdio")
