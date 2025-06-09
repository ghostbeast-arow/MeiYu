import redis
import json
from datetime import datetime, timedelta

class TokenManager:
    def __init__(self, host='localhost', port=6379, db=0):
        self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        self.token_key = 'wx_access_token'
        
    def get_token(self):
        token_data = self.redis.get(self.token_key)
        if token_data:
            data = json.loads(token_data)
            expires_at = datetime.fromisoformat(data['expires_at'])
            if datetime.now() < expires_at:
                return data['token']
        return None
        
    def set_token(self, token, expires_in):
        expires_at = datetime.now() + timedelta(seconds=expires_in - 300)  # 提前5分钟过期
        token_data = {
            'token': token,
            'expires_at': expires_at.isoformat()
        }
        self.redis.set(self.token_key, json.dumps(token_data)) 