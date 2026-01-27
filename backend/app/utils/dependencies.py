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
        print(f"[DEBUG] Token Payload: {payload}")  # 调试日志
    except Exception as e:
        print(f"[DEBUG] Token Decode Error: {e}")
        payload = None
    
    if payload is None:
        print("[DEBUG] Payload is None after decoding")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    
    user_id = payload.get("sub")
    print(f"[DEBUG] User ID from payload: {user_id} (type: {type(user_id)})")
    
    if user_id is None:
        print("[DEBUG] User ID (sub) not found in payload")
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
