import gspread
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

SPREADSHEET_NAME = "AI Extractor Data"
WORKSHEET_NAME = "Extracted Data"

def get_sheets_credentials(access_token: str, refresh_token:str) -> Credentials:
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
    )
    return creds

def get_or_create_worksheet(client: gspread.Client) -> gspread.Worksheet:
    try:
        spreadsheet = client.open(SPREADSHEET_NAME)
    except gspread.SpreadsheetNotFound:
        spreadsheet = client.create(SPREADSHEET_NAME)
        print(f"Created new spreadsheet: {SPREADSHEET_NAME}")
    try:
        worksheet = spreadsheet.worksheet(WORKSHEET_NAME)
    except gspread.WorksheetNotFound:
        worksheet = spreadsheet.add_worksheet(title=WORKSHEET_NAME, rows="100", cols="20")
        print(f"Created new worksheet: {WORKSHEET_NAME}")
        # Initialize with dynamic headers based on common extraction fields
        headers = ["Timestamp", "Filename", "Invoice Number", "Date", "Vendor", "Total Amount", "Status"]
        worksheet.append_row(headers)
    return worksheet

def append_to_sheet(access_token: str, refresh_token: str, extracted_data: dict) -> dict:
    try:
        print(f"📝 Appending to Google Sheet with data: {extracted_data}")
        
        creds = get_sheets_credentials(access_token, refresh_token)
        
        # Refresh token if needed
        if creds.refresh_token:
            try:
                creds.refresh(Request())
                print(f"✅ Token refreshed successfully")
            except Exception as e:
                print(f"⚠️  Token refresh warning: {e}")
        
        client = gspread.authorize(creds)
        worksheet = get_or_create_worksheet(client)

        row = [datetime.now().strftime("%Y-%m-%d %H:%M:%S")]  # Timestamp]
        for data in extracted_data.values():
            if isinstance(data, list):
                row.append(", ".join(map(str, data)))
            else:
                row.append(str(data))

        worksheet.append_row(row)
        print(f"✅ Row appended successfully: {row}")
        return {"success": True, "message": "Data saved to Google Sheets ✅", "row": row}

    except Exception as e:
        print(f"❌ Sheets error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}