import os

class Config:
    # 微信小程序配置
    APPID = "wx0c4e37d22ba9e173"
    SECRET = os.getenv('WX_SECRET', '2b38efa8b0aa540ac37d7ac8076a491e')
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = 'mysql://root:Zby_280304@localhost:3306/poem_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 上传文件配置
    UPLOAD_FOLDER = 'generated'
    
    # Redis配置（用于存储access_token）
    REDIS_HOST = 'localhost'
    REDIS_PORT = 6379
    REDIS_DB = 0