"""
FastAPI 主应用
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.api import auth_router, analysis_router, admin_router
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from sqlalchemy import text

# 创建数据库表
try:
    Base.metadata.create_all(bind=engine)
    # 自动迁移：确保 image_url 是 LONGTEXT
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE artwork_analyses MODIFY image_url LONGTEXT COMMENT '作品图片URL';"))
        # 尝试添加管理员相关字段 (Safe migration)
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin TINYINT DEFAULT 0 COMMENT '是否为管理员';"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE artwork_analyses ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '是否已删除';"))
        except Exception:
            pass
        conn.commit()
    print("Database schema updated successfully.")
except Exception as e:
    print(f"Schema update/check warning: {e}")

# 自动设置指定用户为管理员
try:
    from create_admin import promote_to_admin
    # 用户指定的手机号
    promote_to_admin('13218185056')
    print("Auto-promotion check completed for 13218185056")
except Exception as e:
    print(f"Error executing auto-promotion: {e}")

# 创建 FastAPI 应用
app = FastAPI(
    title="FUHUNG AI 艺术分析 API",
    description="为 FUHUNG AI 艺术分析应用提供后端服务",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 创建子应用用于 API，确保路由独立
api_app = FastAPI(title="FUHUNG API")

# 注册 API 路由到子应用
api_app.include_router(auth_router)
api_app.include_router(analysis_router)
api_app.include_router(admin_router)

@api_app.get("/")
def api_root():
    return {
        "message": "FUHUNG AI 艺术分析 API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# 将 API 子应用挂载到 /api 路径
app.mount("/api", api_app)

# 挂载静态文件 (SPA支持)
# 确保在 Docker 环境中 static 目录存在
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

    # SPA 路由处理 - 必须放在最后
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        处理 SPA 路由：任何未匹配的路径都返回 index.html
        注意：API 请求已被上面的 app.mount("/api", ...) 优先处理
        """
        # 尝试返回对应的静态文件 (如 favicon.ico)
        file_path = os.path.join("static", full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # 默认返回 index.html
        return FileResponse("static/index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "FUHUNG AI 艺术分析 API (Frontend not built)",
            "version": "1.0.0",
            "docs": "/api/docs"
        }
