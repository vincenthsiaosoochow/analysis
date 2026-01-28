from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import csv
import io
from fastapi.responses import StreamingResponse

from app.database import get_db
from app.models import User, ArtworkAnalysis
from app.utils.dependencies import get_current_admin
from app.schemas import UserProfile, ArtworkAnalysisResponse

router = APIRouter(prefix="/admin", tags=["后台管理"])

# -----------------
# 用户管理
# -----------------

@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """获取用户列表 (管理员只有)"""
    query = db.query(User)
    
    if search:
        query = query.filter((User.name.like(f"%{search}%")) | (User.phone.like(f"%{search}%")))
    
    total = query.count()
    users = query.order_by(desc(User.created_at)) \
                 .offset((page - 1) * page_size) \
                 .limit(page_size) \
                 .all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": u.id,
                "name": u.name,
                "phone": u.phone,
                "created_at": u.created_at,
                "is_admin": u.is_admin,
                "avatar_url": u.avatar_url
            }
            for u in users
        ]
    }

@router.get("/users/export")
def export_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """导出所有用户为 CSV"""
    users = db.query(User).order_by(desc(User.created_at)).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # 写入 BOM 以支持 Exce 中文打开
    output.write('\ufeff')
    writer = csv.writer(output)
    
    # 写入表头
    writer.writerow(["ID", "姓名", "手机号", "注册时间", "是否管理员"])
    
    for u in users:
        writer.writerow([
            u.id, 
            u.name or "未设置", 
            str(u.phone) + "\t", # 添加 tab 防止 Excel 将长数字转为科学计数法
            u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else "",
            "是" if u.is_admin else "否"
        ])
    
    output.seek(0)
    
    response = StreamingResponse(
        iter([output.getvalue().encode('utf-8')]),
        media_type="text/csv; charset=utf-8"
    )
    response.headers["Content-Disposition"] = "attachment; filename=users_export.csv"
    return response


# -----------------
# 艺术品/分析管理
# -----------------

@router.get("/analyses")
def list_analyses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query("all", regex="^(all|valid|deleted)$"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """获取所有分析报告"""
    query = db.query(ArtworkAnalysis)
    
    if status == "valid":
        query = query.filter(ArtworkAnalysis.is_deleted == 0)
    elif status == "deleted":
        query = query.filter(ArtworkAnalysis.is_deleted == 1)
        
    total = query.count()
    analyses = query.order_by(desc(ArtworkAnalysis.created_at)) \
                    .offset((page - 1) * page_size) \
                    .limit(page_size) \
                    .all()
    
    def get_status(a):
        if a.is_deleted:
            return "已删除"
        # 如果核心分析为空，视为失败/无效
        if not a.core_analysis:
            return "分析失败"
        return "正常"

    return {
        "total": total,
        "page": page,
        "items": [
            {
                "id": a.id,
                "title": a.title or "无标题",
                "artist": a.artist or "未知",
                "image_url": f"/api/analysis/{a.id}/image", # Use endpoint
                "user_name": a.user.name if a.user else "未知用户",
                "user_phone": a.user.phone if a.user else "",
                "created_at": a.created_at,
                "status": get_status(a),
                "preview_info": {
                    "style": a.core_analysis.get('styleAndSchool', '未识别') if a.core_analysis else "数据缺失",
                    "rating": a.investment_analysis.get('rating', 'N/A') if a.investment_analysis else "N/A",
                    "summary": a.core_analysis.get('artisticValue', '')[:50] + "..." if a.core_analysis else "无内容"
                }
            }
            for a in analyses
        ]
    }

@router.delete("/analyses/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """软删除/下架分析报告"""
    analysis = db.query(ArtworkAnalysis).filter(ArtworkAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="未找到该分析报告")
        
    analysis.is_deleted = 1
    db.commit()
    
    return {"success": True, "message": "分析报告已下架"}
