# FUHUNG AI 艺术分析应用

这是一个基于 AI 的艺术品分析应用，使用通义千问 API 提供专业的艺术品鉴赏和投资建议。

## 项目结构

```
analysis/
├── backend/              # FastAPI 后端
│   ├── app/
│   │   ├── api/         # API 路由
│   │   ├── models/      # 数据库模型
│   │   ├── schemas/     # Pydantic 模型
│   │   ├── services/    # 业务逻辑
│   │   └── utils/       # 工具函数
│   ├── Dockerfile
│   └── requirements.txt
├── services/            # 前端服务层
│   └── apiService.ts   # API 客户端
├── components/          # React 组件
├── App.tsx             # 主应用组件
└── index.tsx           # 应用入口
```

## 技术栈

### 前端
- React 19 + TypeScript
- Vite
- TailwindCSS

### 后端
- Python 3.11+
- FastAPI
- SQLAlchemy
- MySQL
- 通义千问 API

## 本地开发

### 1. 启动后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写数据库连接和通义千问 API Key

# 初始化数据库
python init_db.py

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档：http://localhost:8000/docs

### 2. 启动前端

```bash
# 在项目根目录

# 安装依赖
npm install

# 配置环境变量（确保 .env.local 存在）
# VITE_API_BASE_URL=http://localhost:8000

# 启动开发服务器
npm run dev
```

前端地址：http://localhost:5173

## 环境变量配置

### 后端环境变量（backend/.env）

```env
DATABASE_URL=mysql+pymysql://user:password@host:3306/database
JWT_SECRET=your-secret-key
DASHSCOPE_API_KEY=your-qianwen-api-key
```

### 前端环境变量（.env.local）

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Zeabur 部署

### 1. 准备工作

- 注册 Zeabur 账号
- 准备通义千问 API Key
- 创建 GitHub 仓库并推送代码

### 2. 部署后端

1. 在 Zeabur 创建新项目
2. 添加 MySQL 数据库服务
3. 添加服务，选择 backend 目录
4. 配置环境变量：
   - `DASHSCOPE_API_KEY`: 通义千问 API Key
   - `JWT_SECRET`: 随机生成的密钥
   - `DATABASE_URL`: Zeabur 自动注入
5. 部署并获取后端 URL

### 3. 部署前端

1. 在同一项目中添加前端服务
2. 配置环境变量：
   - `VITE_API_BASE_URL`: 后端服务 URL
3. 部署前端

### 4. 数据库初始化

部署后，通过 Zeabur 控制台或 SSH 连接运行：

```bash
cd backend
python init_db.py
```

## 主要功能

- ✅ 用户注册、登录、密码重置
- ✅ 艺术品图片上传与分析
- ✅ AI 驱动的艺术品鉴赏
- ✅ 投资价值评估
- ✅ 分析记录管理
- ✅ 收藏功能
- ✅ 艺术品发现与搜索

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/reset-password` - 重置密码

### 艺术品分析
- `POST /api/analysis/analyze` - 分析艺术品
- `GET /api/analysis/my-analyses` - 我的分析
- `GET /api/analysis/discover` - 发现艺术品
- `POST /api/analysis/{id}/favorite` - 收藏/取消收藏

## 开发说明

- 前端使用 TypeScript 严格模式
- 后端遵循 Python 类型注解规范
- 所有 API 调用都有错误处理
- 密码使用 bcrypt 加密
- JWT token 有效期 7 天
- 图片上传限制 10MB

## License

MIT
