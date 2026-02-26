"""
FastAPI 依赖函数
用于认证、权限验证等
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils.security import decode_access_token

# HTTP Bearer 认证
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    获取当前登录用户
    验证 JWT token 并返回用户对象
    """
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        payload = None

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )

    return user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    获取当前管理员
    如果不是管理员，抛出 403 异常
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，需要管理员权限"
        )
    return current_user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    可选的当前用户获取
    如果认证失败或未认证，返回 None 而不是抛出异常
    """
    if not credentials:
        return None
        
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        if not payload:
            return None
            
        user_id = payload.get("sub")
        if not user_id:
            return None
            
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None
