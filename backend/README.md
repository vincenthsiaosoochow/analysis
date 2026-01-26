# FUHUNG AI 艺术分析 - 后端 API

基于 FastAPI 构建的艺术品分析后端服务，集成通义千问 API 提供智能艺术品分析功能。

## 主要功能

- 用户认证（注册、登录、密码重置）
- 艺术品图片上传与分析
- 通义千问 AI 分析集成
- 用户收藏与分析记录管理
- RESTful API 接口

## 技术栈

- **框架**: FastAPI 0.115+
- **数据库**: MySQL (通过 SQLAlchemy ORM)
- **AI**: 阿里云通义千问 API
- **认证**: JWT (JSON Web Tokens)
- **密码加密**: bcrypt

## 本地开发

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
- `DATABASE_URL`: MySQL 数据库连接字符串
- `JWT_SECRET`: JWT 签名密钥
- `DASHSCOPE_API_KEY`: 通义千问 API Key

### 3. 初始化数据库

```bash
python init_db.py
```

### 4. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 文档地址: http://localhost:8000/docs

## API 接口

### 认证模块

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/reset-password` - 重置密码

### 艺术品分析模块

- `POST /api/analysis/analyze` - 上传并分析艺术品图片（需认证）
- `GET /api/analysis/my-analyses` - 获取我的分析记录（需认证）
- `GET /api/analysis/discover` - 获取公开分析列表
- `POST /api/analysis/{id}/favorite` - 收藏/取消收藏（需认证）

## Docker 部署

### 构建镜像

```bash
docker build -t fuhung-art-backend .
```

### 运行容器

```bash
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="mysql+pymysql://user:pass@host:3306/db" \
  -e JWT_SECRET="your-secret" \
  -e DASHSCOPE_API_KEY="your-api-key" \
  fuhung-art-backend
```

## Zeabur 部署

1. 将代码推送到 Git 仓库
2. 在 Zeabur 创建新项目并连接仓库
3. 添加 MySQL 数据库服务
4. 配置环境变量：
   - `DASHSCOPE_API_KEY`
   - `JWT_SECRET`
   - `DATABASE_URL` (Zeabur 自动注入)
5. 部署即可

## 项目结构

```
backend/
├── app/
│   ├── api/              # API 路由
│   ├── models/           # 数据库模型
│   ├── schemas/          # Pydantic 模型
│   ├── services/         # 业务逻辑
│   ├── utils/            # 工具函数
│   ├── config.py         # 配置管理
│   ├── database.py       # 数据库连接
│   └── main.py           # 应用入口
├── requirements.txt      # Python 依赖
├── Dockerfile           # Docker 配置
├── init_db.py           # 数据库初始化
└── README.md            # 说明文档
```

## 开发规范

- 所有接口遵循 RESTful 规范
- 使用 Pydantic 进行数据验证
- 密码使用 bcrypt 加密
- JWT token 有效期 7 天
- 图片上传限制 10MB
- 支持的图片格式：JPEG、PNG、WebP

## License

MIT
