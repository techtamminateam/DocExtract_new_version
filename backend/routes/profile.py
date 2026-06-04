from flask import Blueprint, request, jsonify
from models import db, User, UserSession, UserProfile, Document, Template
from flask_mail import Mail, Message
from mail_extension import mail
import os
import random
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

profile_bp = Blueprint("profile_bp", __name__)

@profile_bp.route('profile/update', methods=['PUT'])
def update_profile():
    data = request.get_json()
    user_id = data.get('user_id')
    full_name = data.get('full_name')
    avatar_url = data.get('avatar_url')
    job_title = data.get('job_title')
    company_name = data.get('company_name')
    phone_number = data.get('phone_number')

    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({
            'error': 'User profile not found'
        }), 404
    user_profile.full_name = full_name
    user_profile.avatar_url = avatar_url
    user_profile.job_title = job_title
    user_profile.company_name = company_name
    user_profile.phone_number = phone_number
    user_profile.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Profile updated successfully'
    }), 200

@profile_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({
            'error': 'User profile not found'
        }), 404
    
    return jsonify({
        'full_name': user_profile.full_name,
        'avatar_url': user_profile.avatar_url,
        'job_title': user_profile.job_title,
        'company_name': user_profile.company_name,
        'phone_number': user_profile.phone_number
    }), 200


@profile_bp.route('/profile/stats/<int:user_id>', methods=['GET'])
def get_documents_count(user_id):
    documents_count = Document.query.filter_by(user_id=user_id).count()
    template_count = Template.query.count()
    return jsonify({
        'documents_count': documents_count,
        'template_count': template_count
    }), 200
