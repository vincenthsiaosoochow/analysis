# Zeabur 部署指南

本文档介绍如何将 FUHUNG AI 艺术分析应用部署到 Zeabur 平台。

## 前置要求

1. Zeabur 账号
2. 通义千问 API Key（从阿里云 DashScope 获取）
3. GitHub 仓库（将代码推送到 GitHub）

## 部署步骤

### 1. 准备代码仓库

```bash
# 初始化 Git 仓库（如果还未初始化）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: FUHUNG AI Art Analysis App"

# 推送到 GitHub
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. 部署后端服务

1. 登录 [Zeabur](https://zeabur.com)
2. 创建新项目
3. 点击「添加服务」→「MySQL」，创建数据库
4. 点击「添加服务」→「Git」，选择你的仓库
5. 选择 `backend` 目录作为服务根目录
6. Zeabur 会自动检测 Dockerfile 并开始构建

#### 配置后端环境变量

在后端服务设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|---|------|
| `DASHSCOPE_API_KEY` | `sk-xxx...` | 通义千问 API Key |
| `JWT_SECRET` | `随机字符串` | JWT 签名密钥（建议使用强随机字符串） |
| `DATABASE_URL` | 自动注入 | Zeabur 会自动设置 MySQL 连接 |

#### 初始化数据库

部署完成后，通过 Zeabur 控制台的「Terminal」功能运行：

```bash
cd backend
python init_db.py
```

或者使用 Zeabur 的 「One-Click Command」功能添加初始化脚本。

#### 获取后端 URL

部署成功后，Zeabur 会分配一个 URL，类似：
```
https://your-backend-xxx.zeabur.app
```

记录这个 URL，前端需要使用。

### 3. 部署前端服务

1. 在同一个项目中点击「添加服务」→「Git」
2. 选择同一个仓库
3. 这次选择项目根目录（`/`）
4. Zeabur 会检测到 `package.json` 和 `zbpack.json`

#### 配置前端环境变量

在前端服务设置中添加：

| 变量名 | 值 | 说明 |
|--------|---|------|
| `VITE_API_BASE_URL` | `https://your-backend-xxx.zeabur.app` | 后端服务 URL |

### 4. 绑定自定义域名（可选）

在服务设置中可以绑定自己的域名：
- 前端：`https://art.yourdomain.com`
- 后端：`https://api.yourdomain.com`

记得更新 `VITE_API_BASE_URL` 环境变量。

## 环境变量完整清单

### 后端必需环境变量

```env
# 通义千问 API Key（必需）
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxx

# JWT 密钥（必需，建议使用强随机字符串）
JWT_SECRET=your-super-secret-key-change-this

# 数据库 URL（Zeabur 自动注入）
DATABASE_URL=mysql+pymysql://user:pass@host:3306/db
```

### 前端必需环境变量

```env
# 后端 API 地址（必需）
VITE_API_BASE_URL=https://your-backend.zeabur.app
```

## 获取通义千问 API Key

1. 访问 [阿里云 DashScope](https://dashscope.aliyun.com/)
2. 登录/注册阿里云账号
3. 进入控制台
4. 创建 API Key
5. 复制 API Key（格式：`sk-xxxxxxxxx`）

## 验证部署

### 1. 检查后端

访问：`https://your-backend.zeabur.app/docs`

应该能看到 FastAPI 的 Swagger 文档界面。

### 2. 检查前端

访问前端 URL，应该能正常加载应用。

### 3. 测试完整流程

1. 注册新用户
2. 登录
3. 上传艺术品图片
4. 查看分析结果

## 常见问题

### Q: 数据库连接失败

**A:** 检查 Zeabur 是否正确注入了 `DATABASE_URL`。在服务日志中查看连接字符串是否正确。

### Q: 通义千问 API 调用失败

**A:** 检查：
1. `DASHSCOPE_API_KEY` 是否正确
2. API Key 是否有余额
3. 网络连接是否正常

### Q: 前端无法连接后端

**A:** 检查：
1. `VITE_API_BASE_URL` 是否设置正确
2. 后端服务是否正常运行
3. CORS 配置是否正确

### Q: 图片上传失败

**A:** 检查：
1. 图片大小是否超过 10MB
2. 图片格式是否为 JPEG/PNG/WebP
3. 用户是否已登录

## 更新部署

### 更新代码

```bash
git add .
git commit -m "Update features"
git push
```

Zeabur 会自动检测代码变更并重新部署。

### 更新环境变量

在 Zeabur 控制台修改环境变量后，需要重启服务才能生效。

## 监控和日志

在 Zeabur 控制台的「Logs」标签页可以查看：
- 部署日志
- 应用运行日志
- 错误信息

## 成本估算

Zeabur 免费额度：
- 每月 $5 免费额度
- 超出部分按使用量计费

MySQL 数据库：
- 免费套餐：512MB 存储
- 付费套餐：按需扩展

## 技术支持

如遇到问题，可以：
1. 查看 Zeabur 官方文档
2. 查看项目 README.md
3. 检查服务日志
4. 联系 Zeabur 技术支持

## 后续优化建议

1. 启用 HTTPS（Zeabur 默认支持）
2. 配置 CDN 加速静态资源
3. 设置数据库备份策略
4. 监控 API 使用量和成本
5. 优化图片存储（考虑使用对象存储）
