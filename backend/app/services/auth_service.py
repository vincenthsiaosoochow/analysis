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
    
    # 生成用户昵称：如果未提供姓名，使用 "用户xxxx"（手机号后4位）
    user_name = user_data.name if user_data.name else f"用户{user_data.phone[-4:]}"
    
    try:
        # **关键修复**：强制截断密码到安全长度（远小于 bcrypt 的 72 字节限制）
        # 这个截断发生在应用层，不依赖任何库配置
        safe_password = user_data.password[:50] if len(user_data.password) > 50 else user_data.password
        
        # 创建新用户
        new_user = User(
            name=user_name,
            phone=user_data.phone,
            password_hash=hash_password(safe_password),  # 使用安全截断后的密码
            avatar_url=f"https://picsum.photos/seed/{user_data.phone}/200/200"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"success": True, "message": "注册成功"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )


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
    try:
        # 确保 sub 是字符串
        user_id_str = str(user.id)
        print(f"[DEBUG] Creating token for user_id: {user_id_str}")
        token = create_access_token(data={"sub": user_id_str})
        print(f"[DEBUG] Token created successfully: {token[:20]}...")
    except Exception as e:
        print(f"[ERROR] Token creation failed: {e}")
        raise
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "avatar": user.avatar_url,
            "is_admin": bool(user.is_admin)
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
