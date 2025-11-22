import smtplib
import os

# Hardcode your credentials here JUST for this test
EMAIL_USER = "sjmwatsefu@gmail.com" 
EMAIL_PASS = "mjusjjrhwfhwxmjh"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587

try:
    server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
    server.starttls()
    server.login(EMAIL_USER, EMAIL_PASS)
    print("✅ SUCCESS! Credentials are correct.")
    server.quit()
except Exception as e:
    print(f"❌ FAILED: {e}")