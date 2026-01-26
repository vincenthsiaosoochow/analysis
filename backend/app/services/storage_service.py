"""
图片存储服务
处理图片的保存和管理
"""
import os
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
    保存上传的图片文件
    
    Returns:
        (image_url, base64_data) 元组
    """
    # 验证图片
    validate_image(file)
    
    # 读取文件内容
    content = await file.read()
    
    # 检查文件大小
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超出限制（最大 {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB）"
        )
    
    # 转换为 base64
    base64_data = base64.b64encode(content).decode('utf-8')
    image_url = f"data:{file.content_type};base64,{base64_data}"
    
    return image_url, base64_data
