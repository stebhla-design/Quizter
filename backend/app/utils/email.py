import os
import requests

RESEND_API_URL = "https://api.resend.com/emails"

# Resend's shared test sender. Works without owning/verifying a domain, but it
# can ONLY deliver to the email address of the Resend account owner. For real
# delivery to any recipient, verify a domain in Resend and set EMAIL_FROM.
DEFAULT_FROM = "Quizter <onboarding@resend.dev>"


class EmailNotConfigured(Exception):
    """Raised when the email provider is not configured so the caller can fall back."""


def is_email_configured() -> bool:
    return bool(os.getenv("RESEND_API_KEY"))


def send_email(to_address: str, subject: str, body_text: str, body_html: str | None = None) -> None:
    """Send an email via the Resend HTTP API.

    Required env var: RESEND_API_KEY.
    Optional: EMAIL_FROM (defaults to Resend's onboarding test sender).

    Uses HTTPS (port 443), so it works on hosts that block outbound SMTP
    (e.g. Render's free plan).
    """
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        raise EmailNotConfigured("RESEND_API_KEY must be set to send email")

    sender = os.getenv("EMAIL_FROM", DEFAULT_FROM)

    payload = {
        "from": sender,
        "to": [to_address],
        "subject": subject,
        "text": body_text,
    }
    if body_html:
        payload["html"] = body_html

    resp = requests.post(
        RESEND_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=15,
    )

    if resp.status_code >= 400:
        # Surface the provider's error message to aid debugging.
        raise RuntimeError(f"Resend API error {resp.status_code}: {resp.text}")


def send_password_reset_email(to_address: str, reset_link: str) -> None:
    subject = "Reset your Quizter password"
    body_text = (
        "Hi,\n\n"
        "We received a request to reset your Quizter password. "
        "Click the link below to choose a new password:\n\n"
        f"{reset_link}\n\n"
        "If you didn't request this, you can safely ignore this email.\n\n"
        "— The Quizter Team"
    )
    body_html = f"""
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color:#0d9488;">Reset your Quizter password</h2>
      <p>We received a request to reset your Quizter password. Click the button below to choose a new password.</p>
      <p style="text-align:center; margin: 32px 0;">
        <a href="{reset_link}"
           style="background:#0d9488; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:12px; font-weight:bold; display:inline-block;">
          Reset Password
        </a>
      </p>
      <p style="font-size:13px; color:#64748b;">Or paste this link into your browser:<br>
        <a href="{reset_link}" style="color:#0d9488;">{reset_link}</a>
      </p>
      <p style="font-size:13px; color:#64748b;">If you didn't request this, you can safely ignore this email.</p>
      <p style="font-size:13px; color:#64748b;">— The Quizter Team</p>
    </div>
    """
    send_email(to_address, subject, body_text, body_html)
