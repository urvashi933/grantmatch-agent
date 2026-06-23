import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.skills.pii_redactor import redact_pii

def test_email_redaction():
    text = "Please reach out to help@nonprofit.org for questions."
    result = redact_pii(text)
    assert "[REDACTED_EMAIL]" in result
    assert "help@nonprofit.org" not in result

def test_phone_redaction():
    text = "Contact us at 555-019-2831 anytime."
    result = redact_pii(text)
    assert "[REDACTED_PHONE]" in result
    assert "555-019-2831" not in result

def test_ssn_redaction():
    text = "My SSN is 123-45-6789."
    result = redact_pii(text)
    assert "[REDACTED_SSN]" in result
    assert "123-45-6789" not in result

def test_no_pii_unchanged():
    text = "This text contains no sensitive personal information."
    result = redact_pii(text)
    assert result == text
