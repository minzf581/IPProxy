import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql://root:password@localhost/ip_proxy')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT配置
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # 应用配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'

    # IPIPV API配置
    IPIPV_APP_KEY = os.getenv('IPIPV_APP_KEY')
    IPIPV_APP_SECRET = os.getenv('IPIPV_APP_SECRET')
    IPIPV_API_BASE_URL = os.getenv('IPIPV_API_BASE_URL', 'https://api.ipipv.net')
    IPIPV_SANDBOX_MODE = os.getenv('IPIPV_SANDBOX_MODE', 'True') == 'True'

    # Redis配置
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # Celery配置
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL)
    
    # API限流配置
    RATELIMIT_DEFAULT = "200 per day;50 per hour;1 per second"
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_STRATEGY = 'fixed-window'

    # 回调配置
    CALLBACK_TOKEN = os.getenv('CALLBACK_TOKEN', 'your-callback-token')
    CALLBACK_ENABLED = True

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_ECHO = False
    CALLBACK_ENABLED = True
    
    # 生产环境安全配置
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    IPIPV_SANDBOX_MODE = True
    CALLBACK_ENABLED = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
