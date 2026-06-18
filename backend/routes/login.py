from flask import Blueprint, request, jsonify
from models import db, User, UserSession, UserProfile
from flask_mail import Mail, Message
from mail_extension import mail
import os
import random
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()


login_bp = Blueprint("login_bp", __name__)


@login_bp.route("login/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    try:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Email already exists"}), 400
        
        user = User(email=email)
        user.set_password(password)
        
        # 1. Add and flush user to generate the user.id integer
        db.session.add(user)
        db.session.flush() 
        
        user_profile = UserProfile(
            user_id=user.id,                    # 2. Changed from 'user' to 'user.id'
            full_name=email.split('@')[0],
            avatar_url="",
            job_title="Software Engineer",
            company_name="Tech Tammina",
            phone_number="123-456-7890",
            timezone="UTC",
            created_at=datetime.utcnow(),   # 4. Added () to execute function
        )
        print(email.split('@')[0])
        
        db.session.add(user_profile)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
        
    except Exception as e:
        db.session.rollback() # Good practice: rollback on failure
        return jsonify({"error": str(e)}), 500


from flask_jwt_extended import create_access_token

@login_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password) or not user.is_verified:
        return jsonify({"error": "Invalid email or password"}), 401
    profile = UserProfile.query.filter_by(user_id=user.id).first()
    if profile:
        profile.last_seen_at = datetime.utcnow()
        db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify(access_token=access_token, user = {"email": user.email, "id": user.id}), 200

@login_bp.route("/change_password", methods=["POST"])
def change_password():
    data = request.get_json()
    user_id = data.get("user_id")
    user = User.query.get(user_id)
    print(user)
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    is_current_password_correct = user.check_password(current_password)
    try:
        if not is_current_password_correct:
            return jsonify({"message": "Current password is incorrect"}), 401
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Password changed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@login_bp.route('/send-verification-code', methods=['POST'])
def send_verification_code():
    data = request.get_json()
    email = data.get('email')
    verification_code = str(random.randint(100000, 999999))
    user = User(email=email, verification_code=verification_code)
    db.session.add(user)
    db.session.commit()
    
    try:
        msg = Message(
                subject='Your Verification Code - Tech Tammina',
                recipients=[email],
                html=f'''
                <html>
                    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #2563eb; text-align: center;">Tech Tammina</h2>
                            <h3 style="color: #333;">Email Verification</h3>
                            <p style="color: #666; font-size: 16px;">Your verification code is:</p>
                            <div style="background-color: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                                <h1 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 5px;">{verification_code}</h1>
                            </div>
                            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                            <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Tech Tammina. All rights reserved.</p>
                        </div>
                    </body>
                </html>
                '''
            )
        mail.send(msg)
        return jsonify({
                'message': 'Verification code sent successfully',
                'email': email
            }), 200
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@login_bp.route('/send_otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    email = data.get('email')
    print(email)
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({
            'error': 'User not found'
        }), 404
    verification_code = str(random.randint(100000, 999999))
    user.verification_code = verification_code
    db.session.commit()
    try:
        msg = Message(
                subject='Your OTP Code - Tech Tammina',
                recipients=[email],
                html=f'''
                <html>
                    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #2563eb; text-align: center;">Tech Tammina</h2>
                            <h3 style="color: #333;">Password Reset OTP</h3>
                            <p style="color: #666; font-size: 16px;">Your OTP code is:</p>
                            <div style="background-color: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                                <h1 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 5px;">{verification_code}</h1>
                            </div>
                            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                            <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Tech Tammina. All rights reserved.</p>
                        </div>
                    </body>
                </html>
                '''
            )

        mail.send(msg)
        return jsonify({
            'message': 'OTP sent successfully',
            'email': email
        }), 200 
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@login_bp.route('/change_email/verify_otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    new_email_input = data.get('new_email')
    verification_code = data.get('otp')
    user = User.query.filter_by(email=email, verification_code=verification_code).first()
    if not user:
        return jsonify({
            'error': 'Invalid OTP'
        }), 400
    user.verification_code = None
    user.email = new_email_input
    db.session.commit()
    return jsonify({
        'message': 'OTP verified successfully',
        'email': new_email_input
    }), 200


@login_bp.route('/register/verify-code', methods=['POST'])
def verify_code():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    verification_code = data.get('verification_code')


    user = User.query.filter_by(email=email, verification_code=verification_code).first()
    if user:
        user.is_verified = True
        user.set_password(password)
        user.verification_code = None
        db.session.commit()
        db.session.flush() 
        
        user_profile = UserProfile(
            user_id=user.id,                    # 2. Changed from 'user' to 'user.id'
            full_name=email.split('@')[0],
            avatar_url="",
            job_title="Software Engineer",
            company_name="Tech Tammina",
            phone_number="123-456-7890",
            timezone="UTC",
            created_at=datetime.utcnow()    # 4. Added () to execute function
        )
        
        db.session.add(user_profile)
        db.session.commit()
        return jsonify({
            'message': 'Verification successful',
            'email': email
        }), 200
    else:
        return jsonify({
            'error': 'Invalid verification code'
        }), 400
    
@login_bp.route('/forgot-password/send-otp', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({
            'error': 'User not found'
        }), 404
    verification_code = str(random.randint(100000, 999999))
    user.verification_code = verification_code
    db.session.commit()
    
    try:
        msg = Message(
                subject='Your Verification Code - Tech Tammina',
                recipients=[email],

                html=f'''
                <html>
                    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #2563eb; text-align: center;">Tech Tammina</h2>
                            <h3 style="color: #333;">Password Reset Verification</h3>
                            <p style="color: #666; font-size: 16px;">You have requested to reset your password. Your verification code is:</p>
                            <div style="background-color: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                                <h1 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 5px;">{verification_code}</h1>
                            </div>
                            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                            <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Tech Tammina. All rights reserved.</p>
                        </div>
                    </body>
                </html>
                '''
            )
        mail.send(msg)
        return jsonify({
                'message': 'Verification code sent successfully',
                'email': email
            }), 200
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@login_bp.route('/forgot-password/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    verification_code = data.get('verification_code')
    new_password = data.get('new_password')

    user = User.query.filter_by(email=email, verification_code=verification_code).first()

    if not user:
        return jsonify({
            'error': 'Invalid verification code'
        }), 400

    user.set_password(new_password)
    user.verification_code = None
    db.session.commit()

    return jsonify({
        'message': 'Password reset successful'
    }), 200

