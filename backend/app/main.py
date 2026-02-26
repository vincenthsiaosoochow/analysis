"""
FastAPI 主应用
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.api import auth_router, analysis_router, admin_router, upload_router
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

_logger = logging.getLogger("app.main")

# 创建数据库表
try:
    Base.metadata.create_all(bind=engine)
    _logger.info("Database tables created/verified.")
except Exception as e:
    _logger.error(f"Failed to create database tables: {e}")
    raise  # 数据库表必须创建成功，否则所有 API 都会 500

# NOTE: 以下 ALTER TABLE 均为兼容性迁移，全部捕获异常避免影响启动
# 全新数据库 create_all 已创建正确结构，ALTER 仅用于升级旧数据库
try:
    with engine.connect() as conn:
        # 确保 image_url 是 LONGTEXT（旧版本可能是 TEXT）
        try:
            conn.execute(text("ALTER TABLE artwork_analyses MODIFY image_url LONGTEXT COMMENT '作品图片URL';"))
        except Exception:
            pass
        # 添加管理员字段
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin TINYINT DEFAULT 0 COMMENT '是否为管理员';"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE artwork_analyses ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '是否已删除';"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '是否已删除';"))
        except Exception:
            pass
        conn.commit()
    _logger.info("Database schema migration completed.")
except Exception as e:
    _logger.warning(f"Schema migration warning (non-fatal): {e}")

# 自动设置指定用户为管理员
def promote_to_admin(phone_number: str, db_engine):
    from sqlalchemy.orm import sessionmaker
    from app.models.user import User
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.phone == phone_number).first()
        if user and user.is_admin != 1:
            user.is_admin = 1
            db.commit()
            _logger.info(f"Promoted user {user.phone} to ADMIN.")
    except Exception as e:
        _logger.error(f"Error promoting user: {e}")
    finally:
        db.close()

# 执行自动提升
try:
    promote_to_admin('13218185056', engine)
except Exception as e:
    _logger.error(f"Error executing auto-promotion sequence: {e}")

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

# 配置 Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# 创建子应用用于 API，确保路由独立
api_app = FastAPI(title="FUHUNG API")

# 注册 API 路由到子应用
api_app.include_router(auth_router)
api_app.include_router(analysis_router)
api_app.include_router(admin_router)
api_app.include_router(upload_router)

# NOTE: 图片现在使用 Data URI 存储在数据库中，不再需要挂载 uploads 目录

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
    # NOTE: uploads 已挂载到 API app 下 (/api/uploads)

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
