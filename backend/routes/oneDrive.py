from flask import Flask, redirect, request, session, url_for, Blueprint, jsonify, send_file
import requests
import os
from io import BytesIO
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
    }

    response = requests.post(token_url, data=data)
    token_data = response.json()

    session["onedrive_access_token"] = token_data.get("access_token")
    
    return "Login successful! Now fetch files from /files"

@one_drive_bp.route("/onedrive/files")
def get_files():
    access_token = session.get("onedrive_access_token")
    if not access_token:
        return jsonify({"error": "Not authenticated"}), 401
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
    response = requests.get(url, headers=headers)
    if not response.ok:
        return jsonify({"error": "Failed to fetch files"}), response.status_code

    data = response.json()
    items = data.get("value", [])
    
    pdf_files = []
    for item in items:
        # Check if it is a file and a PDF
        if "file" in item:
            mime = item.get("file", {}).get("mimeType", "")
            if mime == "application/pdf" or item.get("name", "").lower().endswith(".pdf"):
                pdf_files.append({
                    "id": item.get("id"),
                    "name": item.get("name")
                })
                
    return jsonify({"files": pdf_files})

@one_drive_bp.route("/onedrive/files/<path:file_id>", methods=["GET"])
def download_onedrive_file(file_id):
    access_token = session.get("onedrive_access_token")
    if not access_token:
        return jsonify({"error": "Not authenticated"}), 401

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    url = f"https://graph.microsoft.com/v1.0/me/drive/items/{file_id}/content"
    res = requests.get(url, headers=headers)

    if not res.ok:
        return jsonify({"error": "Failed to download OneDrive file"}), res.status_code

    meta_url = f"https://graph.microsoft.com/v1.0/me/drive/items/{file_id}"
    meta_res = requests.get(meta_url, headers=headers)
    filename = "document.pdf"
    if meta_res.ok:
        filename = meta_res.json().get("name", "document.pdf")

    return send_file(
        BytesIO(res.content),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename
    )

@one_drive_bp.route("/onedrive/auth/status")
def onedrive_status():
    if "onedrive_access_token" in session:
        return jsonify({"connected": True})
    else:
        return jsonify({"connected": False})

@one_drive_bp.route("/onedrive/auth/disconnect", methods=["POST"])
def onedrive_disconnect():
    session.pop("onedrive_access_token", None)
    return jsonify({"connected": False})