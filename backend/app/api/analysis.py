"""
艺术品分析相关 API 路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

# ... (rest of imports)

# ... (inside query)
@router.get("/my-analyses", response_model=AnalysisListResponse)
def get_my_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取我的收藏（包括我上传的和我收藏的）
    需要用户认证
    """
    # 获取我收藏的 ID
    favorite_subquery = db.query(UserFavorite.analysis_id).filter(
        UserFavorite.user_id == current_user.id
    )
    
    # 查询：是我上传的 OR 我收藏的
    analyses = db.query(ArtworkAnalysis).filter(
        or_(
            ArtworkAnalysis.user_id == current_user.id,
            ArtworkAnalysis.id.in_(favorite_subquery)
        )
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


@router.get("/{analysis_id}/image")
def get_analysis_image(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """
    获取艺术品图片流
    """
    analysis = db.query(ArtworkAnalysis).filter(ArtworkAnalysis.id == analysis_id).first()
    if not analysis or not analysis.image_url:
        # Return a 1x1 transparent pixel or 404
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        # analysis.image_url is stored as "data:image/png;base64,....."
        # We need to strip the header and decode
        header, base64_str = analysis.image_url.split(",", 1)
        import base64
        image_data = base64.b64decode(base64_str)
        
        # Determine media type from header
        media_type = "image/jpeg"
        if "png" in header:
            media_type = "image/png"
        elif "webp" in header:
            media_type = "image/webp"

        from fastapi import Response
        return Response(content=image_data, media_type=media_type, headers={
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*"
        })
    except Exception as e:
        print(f"Error serving image for {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail="Image processing error")


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
    
    # Use the image endpoint instead of raw base64
    # This keeps the JSON payload small
    image_endpoint = f"/api/analysis/{analysis.id}/image"
    
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
        imageUrl=image_endpoint,
        likes=analysis.likes,
        authorName=author.name if author else None,
        authorAvatar=author.avatar_url if author else None,
        isSaved=is_saved
    )
