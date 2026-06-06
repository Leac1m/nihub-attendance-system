import logging
import os
import smtplib
import ssl
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_TPL_PATH = os.path.join(os.path.dirname(__file__), "brand", "email-template.html")


def _load_template() -> str:
    with open(_TPL_PATH, "r", encoding="utf-8") as f:
        return f.read()


def _render_email(*, subject: str, content: str, cta_url: str = "", cta_text: str = "") -> str:
    tpl = _load_template()
    rendered = tpl.replace("{subject}", subject)
    rendered = rendered.replace("{content}", content)
    if cta_url:
        cta_block = (
            '<div style="margin-top:28px;">'
            f'<a href="{cta_url}" style="display:inline-block;background-color:#70008B;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;">{cta_text}</a>'
            '</div>'
        )
        rendered = rendered.replace("{cta_url}", cta_block)
        rendered = rendered.replace("{/cta_url}", "")
    else:
        rendered = rendered.replace("{cta_url}", "")
        rendered = rendered.replace("{/cta_url}", "")
    return rendered


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
    is_customized = "SMTP_HOST" in os.environ or "SMTP_PORT" in os.environ
    if is_customized:
        return bool(cfg["host"])
    return bool(cfg["host"] and cfg["username"] and cfg["password"])


def _sender_address() -> str:
    cfg = _get_config()
    return cfg["from"] or cfg["username"]


def _web_base_url() -> str:
    """Base URL for the public web portal — used in registrant email links."""
    return os.getenv("WEB_BASE_URL", "http://localhost:8080").rstrip("/")


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

        content_html = (
            f"<p>A new staff account was created.</p>"
            f"<p><strong>Username:</strong> {username}<br/>"
            f"<strong>Email:</strong> {email}<br/>"
            f"<strong>Verification PIN:</strong> <code style='font-size:18px;'>{verification_pin}</code><br/>"
            f"<strong>Expires At:</strong> {expires_at}</p>"
            f"<p>Share this code with the staff member so they can verify their account.</p>"
        )
        html_body = _render_email(
            subject=f"NIHUB staff verification code for {username}",
            content=content_html,
        )

        msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        self._send(msg)

    def send_registration_email(
        self, registrant: dict, qr_bytes: bytes, *, department: dict | None = None,
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

        department_name = department.get("name", "") if department else ""
        department_code = department.get("code", "") if department else ""
        department_duration = department.get("duration", "") if department else ""

        program_text_block = ""
        program_html_block = ""
        if department_name or department_code:
            program_text_block = (
                f"\nDepartment Details:\n"
                f"  Name:     {department_name}\n"
                f"  Code:     {department_code}\n"
            )
            if department_duration:
                program_text_block += f"  Duration: {department_duration}\n"

            program_html_block = (
                f"<p><strong>Department Details:</strong><br/>"
                f"Name: {department_name}<br/>"
                f"Code: <code>{department_code}</code>"
            )
            if department_duration:
                program_html_block += f"<br/>Duration: {department_duration}"
            program_html_block += "</p>"

        msg = MIMEMultipart("related")
        msg["Subject"] = (
            f"Welcome {name} — Your Registration QR Code"
            + (f" for {department_name}" if department_name else "")
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

        content_html = (
            f"<p>Hi <strong>{name}</strong>,</p>"
            f"<p>You have been successfully registered.</p>"
            f"{program_html_block}"
            f"<p>Your <strong>Registrant ID</strong>: <code>{m_id}</code></p>"
            f"<p>Show your QR code below on the day of the department:</p>"
            f'<p><img src="cid:qr_code" alt="Your QR Code" '
            f'style="width:200px;height:200px;border:1px solid #ccc;"/></p>'
        )
        html_body = _render_email(
            subject=msg["Subject"],
            content=content_html,
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

    def send_registrant_verification_email(
        self,
        *,
        email: str,
        matriculation_number: str,
        department_code: str,
        verification_url: str,
    ) -> None:
        """Send the 24h single-use verification link for a new registrant account."""
        if not self.is_configured():
            logger.warning(
                "SMTP not configured — skipping registrant verification email for %s",
                email,
            )
            return

        cfg = _get_config()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your NIHUB portal account"
        msg["From"] = _sender_address()
        msg["To"] = email

        body_text = (
            f"Hi,\n\n"
            f"You (or someone on your behalf) requested portal access for:\n"
            f"  Matriculation number: {matriculation_number}\n"
            f"  Department:           {department_code}\n\n"
            f"Click the link below within 24 hours to verify your email "
            f"and activate your account:\n\n"
            f"  {verification_url}\n\n"
            f"If you did not make this request you can safely ignore this email.\n"
        )

        content_html = (
            f"<p>Hi,</p>"
            f"<p>You (or someone on your behalf) requested portal access for:</p>"
            f"<ul>"
            f"<li><strong>Matriculation number:</strong> {matriculation_number}</li>"
            f"<li><strong>Department:</strong> <code>{department_code}</code></li>"
            f"</ul>"
            f"<p>Click the button below within <strong>24 hours</strong> to verify "
            f"your email and activate your account:</p>"
        )
        html_body = _render_email(
            subject="Verify your NIHUB portal account",
            content=content_html,
            cta_url=verification_url,
            cta_text="Verify my email",
        )

        msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        self._send(msg)

    def send_registrant_welcome_email(
        self,
        *,
        email: str,
        name: str,
        department_code: str,
        matriculation_number: str,
    ) -> None:
        """Send a short welcome once a registrant is fully verified."""
        if not self.is_configured():
            logger.warning(
                "SMTP not configured — skipping registrant welcome email for %s",
                email,
            )
            return

        cfg = _get_config()
        login_url = f"{_web_base_url()}/portal/login"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to the NIHUB portal"
        msg["From"] = _sender_address()
        msg["To"] = email

        body_text = (
            f"Hi {name},\n\n"
            f"Your NIHUB portal account is active.\n"
            f"  Matriculation number: {matriculation_number}\n"
            f"  Department:           {department_code}\n\n"
            f"You can sign in at:\n  {login_url}\n"
        )

        content_html = (
            f"<p>Hi <strong>{name}</strong>,</p>"
            f"<p>Your NIHUB portal account is active.</p>"
            f"<ul>"
            f"<li><strong>Matriculation number:</strong> {matriculation_number}</li>"
            f"<li><strong>Department:</strong> <code>{department_code}</code></li>"
            f"</ul>"
            f"<p>You can sign in at "
            f"<a href='{login_url}'>{login_url}</a>.</p>"
        )
        html_body = _render_email(
            subject="Welcome to the NIHUB portal",
            content=content_html,
            cta_url=login_url,
            cta_text="Open NIHUB Portal",
        )

        msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        self._send(msg)

    def _send(self, msg: MIMEMultipart) -> None:
        cfg = _get_config()

        if cfg["use_tls"] and cfg["port"] != 465:
            context = ssl.create_default_context()
            with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                if cfg["username"] and cfg["password"]:
                    server.login(cfg["username"], cfg["password"])
                server.sendmail(msg["From"], msg["To"], msg.as_string())

        elif cfg["port"] == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=context) as server:
                if cfg["username"] and cfg["password"]:
                    server.login(cfg["username"], cfg["password"])
                server.sendmail(msg["From"], msg["To"], msg.as_string())

        else:
            with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
                if cfg["username"] and cfg["password"]:
                    server.login(cfg["username"], cfg["password"])
                server.sendmail(msg["From"], msg["To"], msg.as_string())
        logger.info("Sent email to %s", msg["To"])


email_service = EmailService()

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