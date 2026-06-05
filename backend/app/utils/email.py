import os
import smtplib
import ssl
from email.message import EmailMessage


class EmailNotConfigured(Exception):
    """Raised when SMTP settings are missing so the caller can fall back."""


def _is_truthy(value: str | None) -> bool:
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def is_email_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_FROM"))


def send_email(to_address: str, subject: str, body_text: str, body_html: str | None = None) -> None:
    """Send an email via a generic SMTP server configured through env vars.

    Required env vars: SMTP_HOST, SMTP_FROM.
    Optional: SMTP_PORT (default 587), SMTP_USER, SMTP_PASSWORD,
    SMTP_USE_TLS (default "true" -> STARTTLS), SMTP_USE_SSL (default "false").
    """
    host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM")
    if not host or not sender:
        raise EmailNotConfigured("SMTP_HOST and SMTP_FROM must be set to send email")

    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    use_ssl = _is_truthy(os.getenv("SMTP_USE_SSL", "false"))
    # STARTTLS by default unless an implicit-SSL connection is requested.
    use_tls = _is_truthy(os.getenv("SMTP_USE_TLS", "true")) and not use_ssl

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_address
    msg.set_content(body_text)
    if body_html:
        msg.add_alternative(body_html, subtype="html")

    context = ssl.create_default_context()
    if use_ssl:
        with smtplib.SMTP_SSL(host, port, context=context) as server:
            if user and password:
                server.login(user, password)
            server.send_message(msg)
    else:
        with smtplib.SMTP(host, port) as server:
            server.ehlo()
            if use_tls:
                server.starttls(context=context)
                server.ehlo()
            if user and password:
                server.login(user, password)
            server.send_message(msg)


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
