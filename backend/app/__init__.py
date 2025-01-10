from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 启用CORS支持

# 注册路由
from .routes.dashboard import dashboard_bp
app.register_blueprint(dashboard_bp)

# 其他初始化代码可以在这里添加

if __name__ == '__main__':
    app.run(debug=True)
