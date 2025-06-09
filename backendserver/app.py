from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from werkzeug.utils import secure_filename
import time
from sqlalchemy.sql import func
import requests
import json
from datetime import datetime, timedelta
from config import Config
from dotenv import load_dotenv
from token_manager import TokenManager

load_dotenv()  # 加载 .env 文件

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# 初始化 TokenManager
token_manager = TokenManager(
    host=app.config['REDIS_HOST'],
    port=app.config['REDIS_PORT'],
    db=app.config['REDIS_DB']
)

# Move these decorator definitions to the top, right after the app initialization
@app.errorhandler(Exception)
def handle_error(error):
    response = {
        "code": 500,
        "message": str(error),
        "data": None
    }
    return jsonify(response), 500

def standard_response(f):
    def wrapper(*args, **kwargs):
        try:
            result = f(*args, **kwargs)
            response = {
                "code": 200,
                "message": "success",
                "data": result
            }
            return jsonify(response)
        except Exception as e:
            return handle_error(e)
    wrapper.__name__ = f.__name__
    return wrapper

# 数据库配置
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:Zby_280304@localhost:3306/poem_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 诗词模型
class Poetry(db.Model):
    __tablename__ = 'poem'
    
    POEM_NAME = db.Column(db.String(100), primary_key=True)  # 诗名
    POEM_TXT = db.Column(db.Text, nullable=False)         # 诗词内容
    GRADE = db.Column(db.String(50))                      # 年级
    dy = db.Column(db.String(20))                         # 朝代
    author = db.Column(db.String(50))                     # 作者
    
    def to_dict(self):
        return {
            'title': self.POEM_NAME,
            'content': self.POEM_TXT,
            'grade': self.GRADE,
            'dynasty': self.dy,
            'author': self.author
        }

# 确保创建所有数据库表
with app.app_context():
    db.create_all()

# 添加诗词相关的路由
@app.route('/poetry/list', methods=['GET'])
@standard_response
def get_poetry_list():
    try:
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        grade = request.args.get('grade', '')
        dynasty = request.args.get('dynasty', '')
        author = request.args.get('author', '')
        
        # 构建查询
        query = Poetry.query
        
        # 添加筛选条件
        if grade and grade != '全部':
            query = query.filter(Poetry.GRADE == grade)
        if dynasty and dynasty != '全部':
            query = query.filter(Poetry.dy == dynasty)
        if author and author != '全部':
            query = query.filter(Poetry.author == author)
        
        # 获总数和分页数据
        total = query.count()
        poems = query.order_by(Poetry.POEM_NAME)\
            .offset((page-1)*per_page)\
            .limit(per_page)\
            .all()
        
        # 格式化返回数据
        items = [{
            'title': p.POEM_NAME,
            'author': p.author,
            'dynasty': p.dy,
            'content': p.POEM_TXT,
            'preview': p.POEM_TXT[:50] + '...' if len(p.POEM_TXT) > 50 else p.POEM_TXT,
            'grade': p.GRADE
        } for p in poems]
        
        return {
            'total': total,
            'items': items
        }
        
    except Exception as e:
        print(f"获取诗词列表失败：{str(e)}")
        raise e

@app.route('/poetry/search', methods=['GET'])
@standard_response
def search_poetry():
    # 获取所有可能的筛选参数
    keyword = request.args.get('keyword', '')
    grade = request.args.get('grade', '')
    dynasty = request.args.get('dynasty', '')
    author = request.args.get('author', '')
    
    # 构建查询
    query = Poetry.query
    
    # 根据提供的参数添加筛选条件
    if keyword:
        query = query.filter(
            db.or_(
                Poetry.POEM_NAME.like(f'%{keyword}%'),
                Poetry.POEM_TXT.like(f'%{keyword}%'),
                Poetry.author.like(f'%{keyword}%')
            )
        )
    if grade:
        query = query.filter(Poetry.GRADE == grade)
    if dynasty:
        query = query.filter(Poetry.dy == dynasty)
    if author:
        query = query.filter(Poetry.author == author)
    
    poems = query.all()
    return [poem.to_dict() for poem in poems]

@app.route('/generate/<type>', methods=['POST'])
@standard_response
def generate(type):
    try:
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')
        author = data.get('author')
        
        print(f"开始生成{type}，诗词：{title}，作者：{author}")
        
        # 只处理"咏鹅"
        if title == '咏鹅':
            if type == 'image':
                return {
                    'success': True,
                    'url': f"/generated/YongE.png",
                    'message': '图片获取成功'
                }
            elif type == 'audio':
                return {
                    'success': True,
                    'url': f"/generated/YongE.mp3",
                    'message': '音频获取成功'
                }
            elif type == 'video':
                return {
                    'success': True,
                    'url': f"/generated/YongE.mp4",
                    'message': '视频获取成功'
                }
        
        return {
            'success': False,
            'message': '暂不支持该诗词的生成'
        }

    except Exception as e:
        print(f"生成过程发生错误：{str(e)}")
        return {
            'success': False,
            'message': str(e)
        }

# 添加在其他路由之前
@app.route('/test_db', methods=['GET'])
@standard_response
def test_db():
    try:
        # 尝试获取所有诗词
        poems = Poetry.query.all()
        result = {
            "connection": "成功",
            "total_poems": len(poems),
            "poems": [poem.to_dict() for poem in poems]
        }
        print("数据库连接测试：", result)  # 控制台打印结果
        return result
    except Exception as e:
        print("数据库连接错误：", str(e))  # 控制台打印错误
        return {
            "connection": "失败",
            "error": str(e)
        }

@app.route('/add_test_data', methods=['GET'])
@standard_response
def add_test_data():
    try:
        test_poems = [
            Poetry(
                POEM_NAME="静夜思",
                POEM_TXT="床前明月光，疑是地上霜。",
                GRADE="三年级",
                dy="唐",
                author="李白"
            ),
            Poetry(
                POEM_NAME="春晓",
                POEM_TXT="春眠不觉晓，处处闻啼鸟。",
                GRADE="四年级",
                dy="唐",
                author="孟浩然"
            )
        ]
        db.session.add_all(test_poems)
        db.session.commit()
        return {"message": "测试数据添加成功"}
    except Exception as e:
        print("添加测试数据失败：", str(e))
        return {"error": str(e)}

@app.route('/poetry/grade/<grade>', methods=['GET'])
@standard_response
def get_poetry_by_grade(grade):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = Poetry.query.filter_by(GRADE=grade)
    total = query.count()
    poems = query.order_by(Poetry.POEM_NAME).offset((page-1)*per_page).limit(per_page).all()
    
    return {
        'total': total,
        'items': [poem.to_dict() for poem in poems]
    }

@app.route('/poetry/dynasty/<dynasty>', methods=['GET'])
@standard_response
def get_poetry_by_dynasty(dynasty):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = Poetry.query.filter_by(dy=dynasty)
    total = query.count()
    poems = query.order_by(Poetry.POEM_NAME).offset((page-1)*per_page).limit(per_page).all()
    
    return {
        'total': total,
        'items': [poem.to_dict() for poem in poems]
    }

@app.route('/poetry/hot', methods=['GET'])
@standard_response
def get_hot_poetry():
    try:
        limit = request.args.get('limit', 10, type=int)
        
        # 从数据库随机获取诗词
        poetry_list = db.session.query(Poetry)\
            .order_by(func.random())\
            .limit(limit)\
            .all()
            
        # 格式化数据
        poetry_data = [{
            'title': p.POEM_NAME,
            'author': p.author,
            'dynasty': p.dy,
            'preview': p.POEM_TXT[:50] if p.POEM_TXT else '',  # 取前50个字作为预览
            'grade': p.GRADE
        } for p in poetry_list]
        
        return {
            'total': len(poetry_data),
            'items': poetry_data
        }
        
    except Exception as e:
        print(f"获取热门诗词失败：{str(e)}")  # 打印错误控制台
        raise e  

# 可选：添加一个简单的统计接口
@app.route('/poetry/stats', methods=['GET'])
@standard_response
def get_poetry_stats():
    try:
        total_count = Poetry.query.count()
        grade_stats = db.session.query(
            Poetry.GRADE, 
            db.func.count(Poetry.POEM_NAME)
        ).group_by(Poetry.GRADE).all()
        
        dynasty_stats = db.session.query(
            Poetry.dy, 
            db.func.count(Poetry.POEM_NAME)
        ).group_by(Poetry.dy).all()
        
        return {
            'total': total_count,
            'by_grade': {grade: count for grade, count in grade_stats if grade},
            'by_dynasty': {dynasty: count for dynasty, count in dynasty_stats if dynasty}
        }
    except Exception as e:
        print(f"获取统计信息失败：{str(e)}")
        raise e

# 保留基本的用户模型
class User(db.Model):
    __tablename__ = 'user'
    
    openid = db.Column(db.String(100), primary_key=True)
    nickname = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=func.now())
    last_login = db.Column(db.DateTime, default=func.now(), onupdate=func.now())

# 简化的登录接口
@app.route('/user/login', methods=['POST'])
@standard_response
def login():
    try:
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return {
                'success': False,
                'message': '缺少登录码'
            }

        # 获取 openid
        url = 'https://api.weixin.qq.com/sns/jscode2session'
        params = {
            'appid': app.config['APPID'],
            'secret': app.config['SECRET'],
            'js_code': code,
            'grant_type': 'authorization_code'
        }
        
        response = requests.get(url, params=params)
        wx_data = response.json()
        
        if 'errcode' in wx_data:
            return {
                'success': False,
                'message': wx_data.get('errmsg', '微信登录失败')
            }

        openid = wx_data['openid']
        
        # 查找或创建用户
        user = User.query.get(openid)
        if not user:
            user = User(openid=openid)
            db.session.add(user)
        user.last_login = func.now()
        db.session.commit()
        
        # 使用 openid 作为 token
        token = openid
        
        return {
            'success': True,
            'token': token,
            'userInfo': {'openid': openid}
        }

    except Exception as e:
        print(f"登录失败：{str(e)}")
        raise e

# 简化的用证装饰器
def require_login(f):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({
                'code': 401,
                'message': '未登录',
                'data': None
            }), 401
            
        # 直接使用 token 为 openid
        user = User.query.get(token)
        if not user:
            return jsonify({
                'code': 401,
                'message': '无效的登录状态',
                'data': None
            }), 401
            
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

# 用户信息接口
@app.route('/user/info', methods=['GET'])
@standard_response
@require_login
def get_user_info():
    token = request.headers.get('Authorization')
    user = User.query.get(token)
    return {
        'openid': user.openid,
        'nickname': user.nickname,
        'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S')
    }

# 修改详情接口
@app.route('/poetry/detail', methods=['GET'])
@standard_response
def get_poetry_detail():
    try:
        title = request.args.get('title')
        author = request.args.get('author')
        
        if not title or not author:
            return {
                'success': False,
                'message': '参数不完整'
            }
            
        # 根据标题和作者查询诗词
        poetry = Poetry.query.filter_by(
            POEM_NAME=title,
            author=author
        ).first()
        
        if not poetry:
            return {
                'success': False,
                'message': '诗词不存在'
            }
            
        return poetry.to_dict()
        
    except Exception as e:
        print(f"获取诗词详情失败：{str(e)}")
        raise e

# 添加静态文件路由
@app.route('/generated/<filename>')
def generated_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 添加新的组合��项接口
@app.route('/poetry/options', methods=['GET'])
@standard_response
def get_poetry_options():
    try:
        # 从数据库中获取所有唯一的年级、朝代和作者
        grades = db.session.query(Poetry.GRADE.distinct()).order_by(Poetry.GRADE).all()
        dynasties = db.session.query(Poetry.dy.distinct()).order_by(Poetry.dy).all()
        authors = db.session.query(Poetry.author.distinct()).order_by(Poetry.author).all()
        
        # 格式化数据
        grades_data = [{'id': i+1, 'name': grade[0]} for i, grade in enumerate(grades) if grade[0]]
        dynasties_data = [{'id': i+1, 'name': dynasty[0]} for i, dynasty in enumerate(dynasties) if dynasty[0]]
        authors_data = [{'id': i+1, 'name': author[0]} for i, author in enumerate(authors) if author[0]]
        
        return {
            'grades': grades_data,
            'dynasties': dynasties_data,
            'authors': authors_data
        }
    except Exception as e:
        print(f"获取选项数据失败：{str(e)}")
        raise e

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

if __name__ == '__main__':
    # 打印服务器地址
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"Server running at: http://{local_ip}:5000")
    
    # 创建上传目录
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # 启动服务器，允许外部访问
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        threaded=True  # 启用多线程支持
    ) 