import logging
import os
import smtplib
import ssl
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def _get_config() -> dict:
    """Read SMTP config lazily so os.getenv() runs after load_dotenv() or
    Docker env injection — not at import time."""
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "username": os.getenv("SMTP_USERNAME", ""),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "use_tls": os.getenv("SMTP_USE_TLS", "true").lower() == "true",
        "from": os.getenv("EMAIL_FROM", ""),
        "admin_email": os.getenv("ADMIN_EMAIL", ""),
    }


def is_configured() -> bool:
    cfg = _get_config()
    # It is configured if host is set AND (credentials are provided OR the host/port has been customized for local dev)
    is_customized = "SMTP_HOST" in os.environ or "SMTP_PORT" in os.environ
    if is_customized:
        return bool(cfg["host"])
    return bool(cfg["host"] and cfg["username"] and cfg["password"])



def _sender_address() -> str:
    cfg = _get_config()
    return cfg["from"] or cfg["username"]


class EmailService:
    def is_configured(self) -> bool:
        return is_configured()

    def send_staff_verification_email(
        self,
        *,
        username: str,
        email: str,
        verification_pin: str,
        expires_at: str,
    ) -> None:
        if not self.is_configured():
            logger.warning(
                "SMTP not configured — skipping staff verification email for %s",
                email,
            )
            return

        cfg = _get_config()
        if not cfg["admin_email"]:
            logger.warning(
                "ADMIN_EMAIL not configured — skipping staff verification email for %s",
                email,
            )
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"NIHUB staff verification code for {username}"
        msg["From"] = _sender_address()
        msg["To"] = cfg["admin_email"]

        body_text = (
            f"A new staff account was created.\n\n"
            f"Username: {username}\n"
            f"Email: {email}\n"
            f"Verification PIN: {verification_pin}\n"
            f"Expires At: {expires_at}\n"
        )

        html_body = (
            f"<html><body style='font-family: Arial, sans-serif; color: #333;'>"
            f"<p>A new staff account was created.</p>"
            f"<p><strong>Username:</strong> {username}<br/>"
            f"<strong>Email:</strong> {email}<br/>"
            f"<strong>Verification PIN:</strong> <code style='font-size: 18px;'>{verification_pin}</code><br/>"
            f"<strong>Expires At:</strong> {expires_at}</p>"
            f"<p>Share this code with the staff member so they can verify their account.</p>"
            f"</body></html>"
        )

        msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        self._send(msg)

    def send_registration_email(
        self, registrant: dict, qr_bytes: bytes, *, course: dict | None = None
    ) -> None:
        if not self.is_configured():
            logger.warning(
                "SMTP not configured — skipping registration email for %s",
                registrant.get("email"),
            )
            return

        cfg = _get_config()
        recipient = registrant["email"]
        name = registrant["name"]
        m_id = registrant["id"]

        # Build course detail strings
        program_name = course.get("name", "") if course else ""
        program_code = course.get("code", "") if course else ""
        program_description = course.get("description", "") if course else ""
        program_duration = course.get("duration", "") if course else ""

        program_text_block = ""
        program_html_block = ""
        if program_name or program_code:
            program_text_block = (
                f"\nProgram Details:\n"
                f"  Name:        {program_name}\n"
                f"  Code:        {program_code}\n"
            )
            if program_description:
                program_text_block += f"  Description: {program_description}\n"
            if program_duration:
                program_text_block += f"  Duration:    {program_duration}\n"

            program_html_block = (
                f"<p><strong>Program Details:</strong><br/>"
                f"Name: {program_name}<br/>"
                f"Code: <code>{program_code}</code>"
            )
            if program_description:
                program_html_block += f"<br/>Description: {program_description}"
            if program_duration:
                program_html_block += f"<br/>Duration: {program_duration}"
            program_html_block += "</p>"

        msg = MIMEMultipart("related")
        msg["Subject"] = (
            f"Welcome {name} — Your Registration QR Code"
            + (f" for {program_name}" if program_name else "")
        )
        msg["From"] = cfg["from"] or cfg["username"]
        msg["To"] = recipient

        body_text = (
            f"Hi {name},\n\n"
            f"You have been successfully registered.\n"
            f"{program_text_block}\n"
            f"Your Registrant ID: {m_id}\n"
            f"Please keep this email for your records.\n"
        )

        html_body = (
            f"<html><body style='font-family: Arial, sans-serif; color: #333;'>"
            f"<p>Hi <strong>{name}</strong>,</p>"
            f"<p>You have been successfully registered.</p>"
            f"{program_html_block}"
            f"<p>Your <strong>Registrant ID</strong>: <code>{m_id}</code></p>"
            f"<p>Show your QR code below on the day of the event:</p>"
            f'<p><img src="cid:qr_code" alt="Your QR Code" '
            f'style="width:200px;height:200px;border:1px solid #ccc;"/></p>'
            f"</body></html>"
        )

        alternative = MIMEMultipart("alternative")
        alternative.attach(MIMEText(body_text, "plain"))
        alternative.attach(MIMEText(html_body, "html"))
        msg.attach(alternative)

        if qr_bytes:
            qr_inline = MIMEImage(qr_bytes, name="qr_code.png")
            qr_inline.add_header("Content-Disposition", "inline", filename="qr_code.png")
            qr_inline.add_header("Content-ID", "<qr_code>")
            msg.attach(qr_inline)

            qr_attach = MIMEImage(qr_bytes, name="qr_code.png")
            qr_attach.add_header(
                "Content-Disposition",
                "attachment",
                filename=f"{m_id}_qr.png",
            )
            msg.attach(qr_attach)
        else:
            logger.warning("No QR code bytes available for registrant %s", m_id)

        self._send(msg)


    def _send(self, msg: MIMEMultipart) -> None:
        cfg = _get_config()
        
        # Scenario 1: Modern Secure SMTP with STARTTLS upgrade (Usually Port 587)
        if cfg["use_tls"] and cfg["port"] != 465:
            context = ssl.create_default_context()
            with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                if cfg["username"] and cfg["password"]:
                    server.login(cfg["username"], cfg["password"])
                server.sendmail(msg["From"], msg["To"], msg.as_string())
                
        # Scenario 2: Legacy Secure SMTP wrapped in implicit SSL (Usually Port 465)
        elif cfg["port"] == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=context) as server:
                if cfg["username"] and cfg["password"]:
                    server.login(cfg["username"], cfg["password"])
                server.sendmail(msg["From"], msg["To"], msg.as_string())
                
        # Scenario 3: Local Dev / Unencrypted mail relays (Usually Port 25 or 1025)
        else:
            with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
                if cfg["username"] and cfg["password"]:
                    server.login(cfg["username"], cfg["password"])
                server.sendmail(msg["From"], msg["To"], msg.as_string())
        logger.info("Sent email to %s", msg["To"])


email_service = EmailService()

# Startup log — visible in container output so you can confirm the env vars were injected.
_cfg = _get_config()
if email_service.is_configured():
    logger.info(
        "Email service configured: SMTP %s:%s (TLS=%s) from=%s",
        _cfg["host"], _cfg["port"], _cfg["use_tls"], _cfg["from"] or _cfg["username"],
    )
else:
    logger.warning(
        "Email service NOT configured — SMTP_USERNAME/SMTP_PASSWORD missing. "
        "Emails will be skipped. Set them in server/.env and restart."
    )

