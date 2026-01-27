# Zeabur 部署问题排查指南

## 问题现象
用户在 `analysis.preview.aliyun-zeabur.cn` 注册时出现 "Load failed" 错误

## 可能的原因

### 1. 前端环境变量未配置
**问题**: 前端不知道后端 API 地址

**解决方案**:
在 Zeabur 前端服务的环境变量中添加：
```
VITE_API_BASE_URL=https://你的后端服务地址.zeabur.app
```

**如何获取后端地址**:
1. 进入 Zeabur 项目
2. 点击后端服务
3. 在「Domains」或「域名」中找到分配的域名
4. 复制完整的 https:// 地址

### 2. 后端服务未启动
**检查方法**:
访问后端 API 文档：`https://你的后端地址.zeabur.app/docs`
- 如果能打开 Swagger 文档 = 后端正常 ✅
- 如果打不开 = 后端有问题 ❌

### 3. 数据库未连接
**检查方法**:
在 Zeabur 后端服务的「Logs」或「日志」中查看是否有数据库连接错误

**常见错误**:
```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError)
```

**解决方案**:
确认环境变量 `DATABASE_URL` 配置正确：
```
DATABASE_URL=mysql+pymysql://root:pjdH7f6n54uoghy9XC8E0AVFPQa312Ji@47.100.243.28:30877/zeabur
```

### 4. 数据库表未创建
**检查方法**:
在 Zeabur 后端服务的 Terminal 中运行：
```bash
python init_db.py
```

### 5. CORS 跨域问题
**检查方法**:
在浏览器开发者工具的 Console 中查看是否有 CORS 错误

**解决方案**:
确认后端 `main.py` 中有正确的 CORS 配置

## 排查步骤

### 步骤 1: 检查前端环境变量
1. 进入 Zeabur 前端服务
2. 点击「Variables」或「环境变量」
3. 确认有 `VITE_API_BASE_URL`
4. 值应该是后端服务的完整 URL

### 步骤 2: 检查后端服务状态
1. 访问 `https://你的后端地址.zeabur.app/docs`
2. 应该能看到 FastAPI 文档界面
3. 尝试在文档中测试 `/api/auth/register` 接口

### 步骤 3: 检查后端日志
1. 进入 Zeabur 后端服务
2. 点击「Logs」
3. 查看最近的错误信息

### 步骤 4: 检查数据库连接
在后端服务的 Terminal 中运行：
```bash
python -c "from app.database import engine; print('Database connected:', engine.url)"
```

### 步骤 5: 初始化数据库
在后端服务的 Terminal 中运行：
```bash
python init_db.py
```

### 步骤 6: 测试注册 API
使用 curl 或 Postman 测试：
```bash
curl -X POST "https://你的后端地址.zeabur.app/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","password":"123456"}'
```

## 完整配置清单

### 后端环境变量（必需）
```
DATABASE_URL=mysql+pymysql://root:pjdH7f6n54uoghy9XC8E0AVFPQa312Ji@47.100.243.28:30877/zeabur
JWT_SECRET=你的JWT密钥（随机字符串）
DASHSCOPE_API_KEY=你的通义千问API Key
```

### 前端环境变量（必需）
```
VITE_API_BASE_URL=https://你的后端服务地址.zeabur.app
```

## 快速测试命令

### 测试后端健康状态
```bash
curl https://你的后端地址.zeabur.app/
```

### 测试注册接口
```bash
curl -X POST "https://你的后端地址.zeabur.app/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","password":"123456"}'
```

### 测试登录接口
```bash
curl -X POST "https://你的后端地址.zeabur.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","password":"123456"}'
```

## 常见错误解决

### Error: "Load failed"
= 前端无法连接后端
→ 检查 `VITE_API_BASE_URL` 环境变量

### Error: "Internal Server Error"
= 后端运行错误
→ 查看后端日志

### Error: "Database connection failed"
= 数据库连接问题
→ 检查 `DATABASE_URL` 环境变量

### Error: "Table doesn't exist"
= 数据库表未创建
→ 运行 `python init_db.py`

---

**重要提示**: 
- 每次修改环境变量后，Zeabur 会自动重启服务
- 确保前后端服务都已成功部署
- 检查 Zeabur 的构建日志，确认没有编译错误
