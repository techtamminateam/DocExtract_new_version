from flask import Flask, redirect, request, session, url_for, Blueprint
import requests
import os
from dotenv import load_dotenv

load_dotenv()

one_drive_bp = Blueprint("one_drive_bp", __name__)

CLIENT_ID = os.getenv("ONEDRIVE_CLIENT_ID")
CLIENT_SECRET = os.getenv("ONEDRIVE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("ONEDRIVE_REDIRECT_URI")
AUTHORITY = os.getenv("ONEDRIVE_AUTHORITY")


@one_drive_bp.route("/auth/microsoft")
def auth_one_drive():
    auth_url = (
        f"{AUTHORITY}/oauth2/v2.0/authorize?"
        f"client_id={CLIENT_ID}&"
        f"response_type=code&"
        f"redirect_uri={REDIRECT_URI}&"
        f"response_mode=query&"
        f"scope=Files.Read.All offline_access"
    )

    print("\n===== AUTH URL =====")
    print(auth_url)
    print("====================\n")

    return redirect(auth_url)

@one_drive_bp.route("/callback")
def auth_callback():
    code = request.args.get("code")
    token_url = f"{AUTHORITY}/oauth2/v2.0/token"

    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
        "client_secret": CLIENT_SECRET,
    }

    response = requests.post(token_url, data=data)
    token_data = response.json()

    session["access_token"] = token_data["access_token"]
    
    return "Login successful! Now fetch files from /files"

@one_drive_bp.route("/onedrive/files")
def get_files():
    access_token = session.get("access_token")
    
    headers ={
        "Authorization": f"Bearer {access_token}"
    }

    url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
    response = requests.get(url, headers=headers)
    files = response.json()

    return files

@one_drive_bp.route("/onedrive/auth/status")
def onedrive_status():
    if "access_token" in session:
        return {"connected": True}
    else:
        return {"connected": False}