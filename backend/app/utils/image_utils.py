"""
图片压缩工具，用于生成缩略图
"""
import base64
from io import BytesIO
from PIL import Image
from typing import Tuple


def create_thumbnail_from_data_uri(data_uri: str, max_width: int = 400, quality: int = 60) -> str:
    """
    从Data URI创建缩略图
    
    Args:
        data_uri: 原始Data URI (data:image/xxx;base64,...)
        max_width: 缩略图最大宽度，默认400px
        quality: JPEG质量，1-100，默认60
    
    Returns:
        压缩后的Data URI
    """
    try:
        # 解析Data URI
        if not data_uri.startswith('data:'):
            return data_uri
        
        # 提取MIME类型和base64数据
        header, base64_data = data_uri.split(',', 1)
        mime_type = header.split(';')[0].split(':')[1]
        
        # 解码base64
        image_data = base64.b64decode(base64_data)
        
        # 打开图片
        image = Image.open(BytesIO(image_data))
        
        # 计算缩略图尺寸
        width, height = image.size
        if width <= max_width:
            # 图片已经足够小，只压缩质量
            new_size = (width, height)
        else:
            # 等比例缩放
            ratio = max_width / width
            new_size = (max_width, int(height * ratio))
        
        # 转换为RGB（如果是RGBA）
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # 缩放图片
        if new_size != (width, height):
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # 保存为JPEG（更小的文件大小）
        buffer = BytesIO()
        image.save(buffer, format='JPEG', quality=quality, optimize=True)
        buffer.seek(0)
        
        # 编码为base64
        thumbnail_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        
        # 返回Data URI
        return f"data:image/jpeg;base64,{thumbnail_base64}"
        
    except Exception as e:
        # 如果处理失败，返回原图
        print(f"缩略图生成失败: {e}")
        return data_uri


def get_data_uri_size_kb(data_uri: str) -> float:
    """获取Data URI的大小（KB）"""
    if not data_uri.startswith('data:'):
        return 0
    _, base64_data = data_uri.split(',', 1)
    return len(base64_data) * 0.75 / 1024  # base64编码后大小约为原始的4/3
