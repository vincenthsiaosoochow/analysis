#!/usr/bin/env python3
"""
数据库迁移脚本：将展览封面图片 URL 从 /uploads/ 更新为 /api/uploads/
用于修复图片路径变更后的兼容性问题
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text, create_engine
from app.config import settings

def migrate_exhibition_images():
    """
    批量更新所有展览的 cover_image 字段
    将 /uploads/ 路径更新为 /api/uploads/
    """
    # 创建数据库连接
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # 查询需要更新的记录数
        result = conn.execute(text(
            "SELECT COUNT(*) FROM exhibitions WHERE cover_image LIKE '/uploads/%'"
        ))
        count = result.scalar()
        
        if count == 0:
            print("✅ 没有需要迁移的展览图片")
            return
        
        print(f"📋 发现 {count} 个展览需要更新图片路径...")
        
        # 批量更新：在 /uploads/ 前添加 /api
        conn.execute(text(
            """
            UPDATE exhibitions 
            SET cover_image = CONCAT('/api', cover_image)
            WHERE cover_image LIKE '/uploads/%'
            """
        ))
        conn.commit()
        
        print(f"✅ 成功更新 {count} 个展览的图片路径")
        print(f"   旧路径: /uploads/xxx.jpg")
        print(f"   新路径: /api/uploads/xxx.jpg")

if __name__ == "__main__":
    try:
        print("=" * 60)
        print("展览图片路径迁移脚本")
        print("=" * 60)
        migrate_exhibition_images()
        print("=" * 60)
        print("迁移完成！")
        print("=" * 60)
    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
