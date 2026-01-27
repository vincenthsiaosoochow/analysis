"""
认证相关 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import UserRegister, UserLogin, PasswordReset, LoginResponse
from app.utils import get_current_user
from app.services import register_user, login_user, reset_password

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    用户注册
    """
    return register_user(user_data, db)



@router.post("/login", response_model=LoginResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    用户登录
    """
    return login_user(login_data, db)


@router.post("/reset-password")
def reset_pwd(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """
    重置密码
    """
    return reset_password(reset_data, db)


@router.get("/me")
def get_current_user_profile(current_user = Depends(get_current_user)):
    """
    获取当前登录用户信息
    """
    return {
        "id": current_user.id,
        "name": current_user.name,
        "phone": current_user.phone,
        "avatar": current_user.avatar_url
    }
