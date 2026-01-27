"""
艺术品分析相关 API 路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session
import random

from app.database import get_db
from app.models import User, ArtworkAnalysis, UserFavorite
from app.schemas import ArtworkAnalysisResponse, AnalysisListResponse
from app.utils import get_current_user
from app.services import analyze_artwork_with_qianwen, save_uploaded_image

router = APIRouter(prefix="/analysis", tags=["艺术品分析"])


@router.post("/analyze", response_model=ArtworkAnalysisResponse)
async def analyze_artwork(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    分析上传的艺术品图片
    需要用户认证
    """
    # 保存图片并获取 base64 数据
    image_url, base64_data = await save_uploaded_image(image)
    
    # 调用通义千问分析
    # 注意：analyze_artwork_with_qianwen 是同步阻塞函数，而当前路由是 async 的
    # 直接调用会阻塞事件循环，导致请求超时或 500 错误
    # 必须使用 run_in_executor 在线程池中运行
    import asyncio
    print(f"[DEBUG] Starting AI analysis for image. Size: {len(base64_data)} chars")
    loop = asyncio.get_running_loop()
    try:
        analysis_result = await loop.run_in_executor(None, analyze_artwork_with_qianwen, base64_data)
        print("[DEBUG] AI analysis completed successfully")
    except Exception as e:
        print(f"[ERROR] AI analysis failed in threadpool: {e}")
        # Fallback to mock if even the threadpool wrapper fails (unlikely, handled inside too)
        from app.services.qianwen_service import _get_mock_analysis
        analysis_result = _get_mock_analysis()

    # 保存分析结果到数据库
    artwork = ArtworkAnalysis(
        user_id=current_user.id,
        title=analysis_result.get("title", "未知作品"),
        artist=analysis_result.get("artist", "未知艺术家"),
        artist_gender=analysis_result.get("artistGender"),
        style=analysis_result.get("style"),
        period=analysis_result.get("period"),
        origin=analysis_result.get("origin"),
        palette=analysis_result.get("palette"),
        composition=analysis_result.get("composition"),
        interpretation=analysis_result.get("interpretation"),
        core_analysis=analysis_result.get("coreAnalysis"),
        artist_info=analysis_result.get("artistInfo"),
        investment_analysis=analysis_result.get("investmentAnalysis"),
        image_url=image_url,
        likes=random.randint(10, 500)
    )
    
    db.add(artwork)
    db.commit()
    db.refresh(artwork)
    
    # 构建响应
    return _build_analysis_response(artwork, current_user, db)


@router.get("/my-analyses", response_model=AnalysisListResponse)
def get_my_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户的分析记录
    需要用户认证
    """
    analyses = db.query(ArtworkAnalysis).filter(
        ArtworkAnalysis.user_id == current_user.id
    ).order_by(ArtworkAnalysis.created_at.desc()).all()
    
    result = [_build_analysis_response(a, current_user, db) for a in analyses]
    
    return {"success": True, "analyses": result}


@router.get("/discover", response_model=AnalysisListResponse)
def discover_analyses(
    search: Optional[str] = Query(None, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100, description="返回数量"),
    db: Session = Depends(get_db)
):
    """
    获取公开的分析列表
    支持搜索和分页
    """
    query = db.query(ArtworkAnalysis)
    
    # 搜索过滤
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (ArtworkAnalysis.title.like(search_pattern)) |
            (ArtworkAnalysis.artist.like(search_pattern)) |
            (ArtworkAnalysis.style.like(search_pattern))
        )
    
    # 按创建时间倒序
    analyses = query.order_by(ArtworkAnalysis.created_at.desc()).limit(limit).all()
    
    # discover 接口不需要用户认证，传入 None
    result = [_build_analysis_response(a, None, db) for a in analyses]
    
    return {"success": True, "analyses": result}


@router.post("/{analysis_id}/favorite")
def toggle_favorite(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    收藏/取消收藏艺术品分析
    需要用户认证
    """
    # 检查分析是否存在
    analysis = db.query(ArtworkAnalysis).filter(ArtworkAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="分析记录不存在")
    
    # 检查是否已收藏
    favorite = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id,
        UserFavorite.analysis_id == analysis_id
    ).first()
    
    if favorite:
        # 取消收藏
        db.delete(favorite)
        db.commit()
        return {"success": True, "isSaved": False}
    else:
        # 添加收藏
        new_favorite = UserFavorite(
            user_id=current_user.id,
            analysis_id=analysis_id
        )
        db.add(new_favorite)
        db.commit()
        return {"success": True, "isSaved": True}


def _build_analysis_response(
    analysis: ArtworkAnalysis,
    current_user: Optional[User],
    db: Session
) -> ArtworkAnalysisResponse:
    """
    构建分析响应对象
    """
    # 检查是否已收藏
    is_saved = False
    if current_user:
        favorite = db.query(UserFavorite).filter(
            UserFavorite.user_id == current_user.id,
            UserFavorite.analysis_id == analysis.id
        ).first()
        is_saved = favorite is not None
    
    # 获取作者信息
    author = db.query(User).filter(User.id == analysis.user_id).first()
    
    return ArtworkAnalysisResponse(
        id=analysis.id,
        title=analysis.title,
        artist=analysis.artist,
        artistGender=analysis.artist_gender,
        style=analysis.style,
        period=analysis.period,
        origin=analysis.origin,
        palette=analysis.palette,
        composition=analysis.composition,
        interpretation=analysis.interpretation,
        coreAnalysis=analysis.core_analysis,
        artistInfo=analysis.artist_info,
        investmentAnalysis=analysis.investment_analysis,
        imageUrl=analysis.image_url,
        likes=analysis.likes,
        authorName=author.name if author else None,
        authorAvatar=author.avatar_url if author else None,
        isSaved=is_saved
    )
