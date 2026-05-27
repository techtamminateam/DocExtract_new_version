from flask_mail import Mail
import redis

mail = Mail()

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True
)