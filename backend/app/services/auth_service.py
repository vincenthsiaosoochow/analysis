"""
认证服务
处理用户注册、登录、密码重置等业务逻辑
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import User
from app.schemas import UserRegister, UserLogin, PasswordReset
from app.utils import hash_password, verify_password, create_access_token


def register_user(user_data: UserRegister, db: Session) -> dict:
    """
    注册新用户
    """
    # 检查手机号是否已注册
    existing_user = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该手机号已被注册"
        )
    
    # 创建新用户
    new_user = User(
        name=user_data.name,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        avatar_url=f"https://picsum.photos/seed/{user_data.phone}/200/200"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"success": True, "message": "注册成功"}


def login_user(login_data: UserLogin, db: Session) -> dict:
    """
    用户登录
    """
    # 查找用户
    user = db.query(User).filter(User.phone == login_data.phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="手机号或密码错误"
        )
    
    # 验证密码
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="手机号或密码错误"
        )
    
    # 生成 JWT token
    token = create_access_token(data={"sub": user.id})
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "avatar": user.avatar_url
        }
    }


def reset_password(reset_data: PasswordReset, db: Session) -> dict:
    """
    重置密码
    """
    # 查找用户
    user = db.query(User).filter(User.phone == reset_data.phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该手机号对应的用户"
        )
    
    # 更新密码
    user.password_hash = hash_password(reset_data.new_password)
    db.commit()
    
    return {"success": True, "message": "密码重置成功"}
