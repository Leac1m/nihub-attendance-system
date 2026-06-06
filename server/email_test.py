import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
# CRITICAL: If using smtp.gmail.com, SMTP_USERNAME must be your actual Gmail address,
# not the custom domain email you are sending 'as'.
smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
smtp_port = int(os.getenv("SMTP_PORT", "587"))
smtp_username = os.getenv("SMTP_USERNAME") 
smtp_password = os.getenv("SMTP_PASSWORD")

print(smtp_host, smtp_port, smtp_username)  # Debug: Print config values (except password)
# Email details
sender_email = "nihub@futminna.edu.ng"  # The address recipients see
receiver_email = "ochaiisaac120@gmail.com"  # REPLACE with your real email to test
subject = "SMTP Test Email"
body = "This is a test email to verify the SMTP configuration."

# Create the email
message = MIMEMultipart("alternative")
message["Subject"] = subject
message["From"] = sender_email
message["To"] = receiver_email

# Add plain text and HTML versions (optional but good practice)
text_part = MIMEText(body, "plain")
html_part = MIMEText(f"<h3>{body}</h3>", "html")
message.attach(text_part)
message.attach(html_part)

# Connect and send
try:
    print(f"Connecting to {smtp_host}:{smtp_port}...")
    # Create a secure SSL context
    context = ssl.create_default_context()
    
    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
        server.starttls(context=context) # Secure the connection
        server.login(smtp_username, smtp_password)
        print("Login successful.")
        
        server.sendmail(sender_email, receiver_email, message.as_string())
        print(f"Email sent successfully to {receiver_email}!")
        
except smtplib.SMTPAuthenticationError:
    print("ERROR: Authentication failed.")
    print("-> Check if SMTP_USERNAME is your actual Gmail address (if using Gmail SMTP).")
    print("-> Ensure you are using an App Password, not your regular password.")
except smtplib.SMTPConnectError:
    print("ERROR: Failed to connect to the server.")
    print("-> Check SMTP_HOST and SMTP_PORT.")
except Exception as e:
    print(f"ERROR: An unexpected error occurred: {e}")   