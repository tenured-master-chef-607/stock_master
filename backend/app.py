from flask import Flask, request
from flask_cors import CORS
from routes.stock import stock_bp
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 简化 CORS 配置
CORS(app, 
     origins=["http://localhost:3000"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# 注册蓝图
app.register_blueprint(stock_bp, url_prefix='/api')

@app.before_request
def before_request():
    logger.info(f"Received request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")

@app.after_request
def after_request(response):
    logger.info(f"Response status: {response.status}")
    # 移除之前的 CORS 头部设置，让 flask-cors 处理
    return response

if __name__ == '__main__':
    logger.info("Starting Flask server on http://localhost:8002")
    app.run(host='0.0.0.0', port=8002, debug=True) 