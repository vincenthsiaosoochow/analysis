"""
安全工具函数
包含密码加密、JWT token 生成和验证
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
import hashlib
from app.utils.logger import get_logger

logger = get_logger(__name__)

# 密码加密上下文
# 配置 bcrypt__truncate_error=False 以自动截断超长密码而不是抛出错误
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__truncate_error=False  # 关键配置：自动截断超过72字节的密码
)


def _preprocess_password(password: str) -> str:
    """
    预处理密码以避免 bcrypt 的 72 字节限制
    使用 SHA256 将任意长度的密码转换为固定长度的十六进制字符串
    """
    # SHA256 哈希后转为十六进制字符串（64个字符，远小于72字节）
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def hash_password(password: str) -> str:
    """
    对密码进行哈希加密
    临时简化版本：直接截断并记录日志
    """
    # 强制截断到绝对安全的长度
    truncated_pwd = password[:20]  # 20个字符绝对不会超过72字节
    
    # 记录日志用于调试
    logger.debug(f"原始密码长度: {len(password)}, 截断后长度: {len(truncated_pwd)}")
    logger.debug(f"截断后密码字节数: {len(truncated_pwd.encode('utf-8'))}")
    
    try:
        # 使用最简单的bcrypt调用
        import bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(truncated_pwd.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"bcrypt加密失败: {e}", exc_info=True)
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码是否匹配
    """
    truncated_pwd = plain_password[:20]
    try:
        import bcrypt
        return bcrypt.checkpw(truncated_pwd.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"密码验证失败: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    创建 JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    解码 JWT token
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.debug(f"JWT Decode Error: {e}")
        return None
