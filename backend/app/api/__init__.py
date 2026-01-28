"""
API 路由包初始化
"""
from app.api.auth import router as auth_router
from app.api.analysis import router as analysis_router
from app.api.admin import router as admin_router

__all__ = ["auth_router", "analysis_router", "admin_router"]
