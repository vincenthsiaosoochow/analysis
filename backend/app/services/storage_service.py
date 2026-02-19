"""
图片存储服务
处理图片的保存和管理 - 使用数据库存储（Data URI）以避免容器重启丢失文件
"""
import base64
from typing import Tuple
from fastapi import UploadFile, HTTPException

from app.config import settings


def validate_image(file: UploadFile) -> None:
    """
    验证上传的图片文件
    """
    # 检查文件类型
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图片格式。支持的格式: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
        )


async def save_uploaded_image(file: UploadFile) -> Tuple[str, str]:
    """
    保存上传的图片为 Data URI（base64编码）
    存储在数据库中，避免容器重启导致文件丢失
    
    Returns:
        (image_url, base64_data) 元组
        - image_url: Data URI 格式的图片数据
        - base64_data: 纯 base64 编码字符串
    """
    # 验证图片
    validate_image(file)
    
    # 读取文件内容
    content = await file.read()
    
    # 检查文件大小（限制为 10MB，兼顾用户体验与系统性能）
    max_size = settings.MAX_UPLOAD_SIZE  # 默认 10MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超出限制（最大 {max_size / 1024 / 1024}MB）"
        )
    
    # 转换为 base64
    base64_data = base64.b64encode(content).decode('utf-8')
    
    # 返回 Data URI 格式（直接可在 <img> 标签中使用）
    image_url = f"data:{file.content_type};base64,{base64_data}"
    
    return image_url, base64_data
