import logging
import os
import smtplib
import ssl
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
EMAIL_FROM = os.getenv("EMAIL_FROM", "")

QR_CODES_DIR = Path(__file__).parent / "qr_codes"

def is_configured() -> bool:
        return bool(SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD)

print(f"EmailService configured: {is_configured()}", SMTP_PASSWORD)
class EmailService:
    def is_configured(self) -> bool:
        return bool(SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD)

    def send_registration_email(self, registrant: dict, qr_code_id: str) -> None:
        if not self.is_configured():
            logger.warning(
                "SMTP not configured — skipping registration email for %s",
                registrant.get("email"),
            )
            return

        recipient = registrant["email"]
        name = registrant["name"]
        m_id = registrant["id"]

        msg = MIMEMultipart("related")
        msg["Subject"] = f"Welcome {name} — Your Registration QR Code"
        msg["From"] = EMAIL_FROM
        msg["To"] = recipient

        body_text = (
            f"Hi {name},\n\n"
            f"You have been successfully registered.\n\n"
            f"Your Registrant ID: {m_id}\n"
            f"Please keep this email for your records.\n"
        )

        html_body = (
            f"<html><body style='font-family: Arial, sans-serif; color: #333;'>"
            f"<p>Hi <strong>{name}</strong>,</p>"
            f"<p>You have been successfully registered.</p>"
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

        qr_image_path = QR_CODES_DIR / f"{qr_code_id}.png"

        if qr_image_path.exists():
            with qr_image_path.open("rb") as fh:
                qr_inline = MIMEImage(fh.read(), name=qr_image_path.name)
            qr_inline.add_header("Content-Disposition", "inline", filename=qr_image_path.name)
            qr_inline.add_header("Content-ID", "<qr_code>")
            msg.attach(qr_inline)

            with qr_image_path.open("rb") as fh:
                qr_attach = MIMEImage(fh.read(), name=qr_image_path.name)
            qr_attach.add_header(
                "Content-Disposition",
                "attachment",
                filename=f"{m_id}_qr.png",
            )
            msg.attach(qr_attach)
        else:
            logger.warning("QR code image not found at %s", qr_image_path)

        self._send(msg)

    def _send(self, msg: MIMEMultipart) -> None:
        if SMTP_USE_TLS:
            context = ssl.create_default_context()
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(msg["From"], msg["To"], msg.as_string())
        else:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(msg["From"], msg["To"], msg.as_string())
        logger.info("Sent registration email to %s", msg["To"])


email_service = EmailService()
