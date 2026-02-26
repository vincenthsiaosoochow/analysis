"""
图片存储服务
处理图片的保存和管理 - 使用数据库存储（Data URI）以避免容器重启丢失文件
"""
import base64
import io
from typing import Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# AI 分析用的图片最大尺寸（长边不超过此值）
# 1200px 足够 AI 识别细节，同时大幅减少 API 处理时间
AI_MAX_DIMENSION = 1200
# AI 分析用的 JPEG 压缩质量（0-100）
AI_JPEG_QUALITY = 80


def validate_image(file: UploadFile) -> None:
    """
    验证上传的图片文件
    """
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图片格式。支持的格式: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
        )


def compress_image_for_ai(content: bytes) -> str:
    """
    压缩图片用于 AI 分析：缩小尺寸 + JPEG 压缩
    大幅减少通义千问 API 处理时间（从 60s+ 降至 10-20s）

    Returns:
        压缩后的纯 base64 字符串
    """
    try:
        img = Image.open(io.BytesIO(content))

        # 记录原始尺寸
        original_size = img.size
        original_kb = len(content) / 1024

        # 转换为 RGB（处理 RGBA/P 等模式）
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")

        # 按比例缩小到 AI_MAX_DIMENSION
        width, height = img.size
        if max(width, height) > AI_MAX_DIMENSION:
            ratio = AI_MAX_DIMENSION / max(width, height)
            new_size = (int(width * ratio), int(height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        # 压缩为 JPEG
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=AI_JPEG_QUALITY, optimize=True)
        compressed = buffer.getvalue()

        compressed_kb = len(compressed) / 1024
        logger.info(
            f"Image compressed for AI: {original_size} -> {img.size}, "
            f"{original_kb:.0f}KB -> {compressed_kb:.0f}KB "
            f"({compressed_kb/original_kb*100:.0f}%)"
        )

        return base64.b64encode(compressed).decode("utf-8")

    except Exception as e:
        # 压缩失败时回退到原图
        logger.warning(f"Image compression failed, using original: {e}")
        return base64.b64encode(content).decode("utf-8")


async def save_uploaded_image(file: UploadFile) -> Tuple[str, str]:
    """
    保存上传的图片为 Data URI（base64编码）
    存储在数据库中，避免容器重启导致文件丢失

    Returns:
        (image_url, ai_base64) 元组
        - image_url: Data URI 格式的原始图片（存数据库、前端展示用）
        - ai_base64: 压缩后的 base64 字符串（发给 AI 分析用）
    """
    validate_image(file)

    content = await file.read()

    # 检查文件大小
    max_size = settings.MAX_UPLOAD_SIZE
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超出限制（最大 {max_size / 1024 / 1024}MB）"
        )

    # 原图 base64 → 存数据库，前端展示用
    original_base64 = base64.b64encode(content).decode("utf-8")
    image_url = f"data:{file.content_type};base64,{original_base64}"

    # 压缩图 base64 → 发给 AI 分析用
    ai_base64 = compress_image_for_ai(content)

    return image_url, ai_base64
