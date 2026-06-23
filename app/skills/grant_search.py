def search_grants(mission_keywords: str) -> str:
    """
    Simulates searching a grant database for opportunities matching the non-profit's mission.
    
    Args:
        mission_keywords (str): A comma-separated list of keywords describing the non-profit's mission.
        
    Returns:
        str: A string containing matching grant opportunities.
    """
    keywords = mission_keywords.lower()
    results = []
    
    if "education" in keywords or "tutor" in keywords or "school" in keywords:
        results.append("- Global Education Fund: $50,000 grant for after-school tutoring programs targeting low-income areas. Deadline: Oct 1.")
        results.append("- EdTech Innovation Grant: $25,000 for non-profits providing digital learning tools.")
    
    if "health" in keywords or "medical" in keywords:
        results.append("- Community Wellness Initiative: $100,000 for local health clinics and awareness programs.")
        
    if "environment" in keywords or "eco" in keywords or "climate" in keywords:
        results.append("- Green Earth Action Grant: $75,000 for community-led sustainability and recycling programs.")
        
    if not results:
        return "No specific grants found for these keywords, but the 'General Community Impact Grant' ($10,000) is available for all registered 501(c)(3) organizations."
        
    return "\n".join(results)
