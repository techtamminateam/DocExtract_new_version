from io import BytesIO

from flask import Blueprint, redirect, request, session, jsonify, send_file
import urllib.parse
import secrets
import requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import os

from dotenv import load_dotenv

load_dotenv()

integration_bp = Blueprint("integration_bp", __name__)

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") 
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")



def get_drive_credentials():
    access_token = session.get("access_token")
    refresh_token = session.get("refresh_token")

    if not access_token:
        raise ValueError("Not authenticated")

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
    )

    if creds.refresh_token:
        try:
            creds.refresh(Request())
            session["access_token"] = creds.token
            session.modified = True
        except Exception:
            pass

    return creds

# 🔐 Step 1: Redirect to Google login
@integration_bp.route("/auth/google")
def auth_google():
    state = secrets.token_urlsafe(16)
    session["oauth_state"] = state

    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/drive.readonly",
        "access_type": "offline",
        "prompt": "consent",
        "state": state
    }

    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return redirect(auth_url)


# 🔁 Step 2: Callback (Google → your backend)
@integration_bp.route("/auth/callback")
def auth_callback():
    code = request.args.get("code")
    state = request.args.get("state")

    # 🔐 Validate state
    if state != session.get("oauth_state"):
        return jsonify({"error": "Invalid state"}), 400

    token_url = "https://oauth2.googleapis.com/token"

    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    token_response = requests.post(token_url, data=data).json()

    # ✅ Store tokens in session
    session["access_token"] = token_response.get("access_token")
    session["refresh_token"] = token_response.get("refresh_token")

    # redirect back to React app
    return redirect("http://localhost:3000")


# 📊 Step 3: Check connection
@integration_bp.route("/auth/status")
def auth_status():
    return jsonify({
        "connected": "access_token" in session
    })

# 🔌 Step 3b: Disconnect from Drive
@integration_bp.route("/auth/disconnect", methods=["POST"])
def auth_disconnect():
    access_token = session.get("access_token")

    if access_token:
        try:
            # Revoke the access token when we still have one.
            revoke_url = "https://oauth2.googleapis.com/revoke"
            requests.post(
                revoke_url,
                data={"token": access_token},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
        except Exception as e:
            # Token revocation failed, but we'll still clear the session.
            print(f"Token revocation error: {e}")

    # Clear session tokens whether or not revocation succeeded.
    session.pop("access_token", None)
    session.pop("refresh_token", None)
    session.pop("oauth_state", None)
    session.modified = True

    return jsonify({
        "status": "success",
        "message": "Disconnected from Google Drive",
        "was_connected": bool(access_token)
    })


# 📂 Step 4: List PDF files from Drive
@integration_bp.route("/drive/files")
def list_files():
    try:
        creds = get_drive_credentials()
    except ValueError:
        return jsonify({"error": "Not authenticated"}), 401

    headers = {"Authorization": f"Bearer {creds.token}"}
    params = {
        "q": "mimeType='application/pdf' and trashed=false",
        "fields": "files(id, name)",
        "pageSize": 100,
        "supportsAllDrives": "true",
        "includeItemsFromAllDrives": "true",
        "corpora": "allDrives",
    }

    res = requests.get("https://www.googleapis.com/drive/v3/files", headers=headers, params=params)
    data = res.json()

    if not res.ok:
        return jsonify({
            "error": data.get("error", {}).get("message", "Failed to list Drive files"),
            "details": data
        }), res.status_code

    return jsonify(data)


@integration_bp.route("/drive/files/<path:file_id>", methods=["GET"])
def download_drive_file(file_id):
    try:
        creds = get_drive_credentials()
    except ValueError:
        return jsonify({"error": "Not authenticated"}), 401

    metadata_res = requests.get(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        headers={"Authorization": f"Bearer {creds.token}"},
        params={"fields": "id, name, mimeType"}
    )
    metadata = metadata_res.json()

    if not metadata_res.ok:
        return jsonify({
            "error": metadata.get("error", {}).get("message", "Failed to read Drive file metadata"),
            "details": metadata
        }), metadata_res.status_code

    file_res = requests.get(
        f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media",
        headers={"Authorization": f"Bearer {creds.token}"},
    )

    if not file_res.ok:
        try:
            error_data = file_res.json()
            error_message = error_data.get("error", {}).get("message", "Failed to download Drive file")
        except Exception:
            error_message = "Failed to download Drive file"
        return jsonify({
            "error": error_message
        }), file_res.status_code

    return send_file(
        BytesIO(file_res.content),
        mimetype=metadata.get("mimeType", "application/pdf"),
        as_attachment=False,
        download_name=metadata.get("name", "drive-file.pdf"),
    )


# 📥 Step 5: Extract selected file
@integration_bp.route("/extract-from-drive", methods=["POST"])
def extract_from_drive():
    data = request.get_json()
    file_id = data.get("file_id")

    access_token = session.get("access_token")

    if not access_token:
        return jsonify({"error": "Not authenticated"}), 401

    headers = {"Authorization": f"Bearer {access_token}"}

    # download file
    file_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
    file_res = requests.get(file_url, headers=headers)

    # send to your extraction API
    files = {
        "file": ("document.pdf", file_res.content, "application/pdf")
    }

    extraction_res = requests.post(
        "http://localhost:5000/your-extract-endpoint",  # 🔁 replace this
        files=files
    )

    return jsonify(extraction_res.json())
