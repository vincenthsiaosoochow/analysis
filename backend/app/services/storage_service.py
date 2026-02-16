"""
图片存储服务
处理图片的保存和管理
"""
import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException

from app.config import settings


# 上传目录配置
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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
    保存上传的图片文件到磁盘
    
    Returns:
        (image_url, file_path) 元组
        - image_url: 可访问的 HTTP URL（如 /uploads/xxx.jpg）
        - file_path: 文件在磁盘上的完整路径
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
    
    # 生成唯一文件名（使用 UUID 防止冲突）
    file_extension = Path(file.filename).suffix if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # 保存文件到磁盘
    with open(file_path, "wb") as f:
        f.write(content)
    
    # 返回可访问的 URL（通过 API app 挂载点访问）
    # 图片将通过 /api/uploads/xxx.jpg 访问
    image_url = f"/api/uploads/{unique_filename}"
    
    return image_url, str(file_path)
