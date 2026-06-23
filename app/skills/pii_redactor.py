import re

def redact_pii(text: str) -> str:
    """
    Redacts sensitive Personally Identifiable Information (PII) such as phone numbers,
    emails, and Social Security Numbers from the provided text.
    
    Args:
        text (str): The raw text potentially containing PII.
        
    Returns:
        str: The scrubbed text with PII replaced by placeholders.
    """
    # Redact Emails
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    redacted = re.sub(email_pattern, '[REDACTED_EMAIL]', text)
    
    # Redact Phone Numbers (Basic US format)
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    redacted = re.sub(phone_pattern, '[REDACTED_PHONE]', redacted)
    
    # Redact Social Security Numbers (Basic US format)
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    redacted = re.sub(ssn_pattern, '[REDACTED_SSN]', redacted)
    
    return redacted
