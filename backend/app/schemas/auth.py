"""
认证相关的 Pydantic 模型
用于请求验证和响应序列化
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """用户注册请求"""
    phone: str = Field(..., min_length=11, max_length=11, description="手机号")
    password: str = Field(..., min_length=6, max_length=50, description="密码")
    name: Optional[str] = Field(None, max_length=100, description="用户姓名（可选）")


class UserLogin(BaseModel):
    """用户登录请求"""
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class PasswordReset(BaseModel):
    """密码重置请求"""
    phone: str = Field(..., description="手机号")
    new_password: str = Field(..., min_length=6, max_length=50, description="新密码")


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    name: str
    phone: str
    avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """登录响应"""
    success: bool = True
    token: str
    user: UserResponse
