from typing import Dict
import smtplib
import os
from email.mime.text import MIMEText
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class AlertService:
    def __init__(self):
        self.email_config = {
            'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': int(os.getenv('SMTP_PORT', '587')),
            'username': os.getenv('EMAIL_USERNAME', ''),
            'password': os.getenv('EMAIL_PASSWORD', '')
        }
    
    def send_email_alert(self, symbol: str, alert_type: str, data: Dict):
        """
        Send an email alert when a stock triggers a specified alert condition.
        
        Args:
            symbol: Stock symbol
            alert_type: Type of alert triggered
            data: Alert data containing details
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            if not self.email_config['username'] or not self.email_config['password']:
                logger.warning("Email credentials not configured. Alert not sent.")
                return False
                
            msg = MIMEText(f"Stock {symbol} triggered {alert_type} alert\nDetails: {str(data)}")
            msg['Subject'] = f"Stock Alert - {symbol}"
            msg['From'] = self.email_config['username']
            msg['To'] = self.email_config['username']
            
            with smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port']) as server:
                server.starttls()
                server.login(self.email_config['username'], self.email_config['password'])
                server.send_message(msg)
            
            logger.info(f"Alert email sent for {symbol}")
            return True
        except Exception as e:
            logger.error(f"Failed to send alert email: {str(e)}")
            return False