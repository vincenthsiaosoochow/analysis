"""
艺术品分析相关 API 路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
import random
import base64
import asyncio

from app.database import get_db
from app.models import User, ArtworkAnalysis, UserFavorite
from app.schemas import ArtworkAnalysisResponse, AnalysisListResponse
from app.utils import get_current_user, get_current_user_optional
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
    print(f"[DEBUG] Starting AI analysis for image. Size: {len(base64_data)} chars")
    loop = asyncio.get_running_loop()
    # 调用通义千问分析
    print(f"[DEBUG] Starting AI analysis for image. Size: {len(base64_data)} chars")
    loop = asyncio.get_running_loop()
    try:
        analysis_result = await loop.run_in_executor(None, analyze_artwork_with_qianwen, base64_data)
        print("[DEBUG] AI analysis completed successfully")
    except Exception as e:
        error_msg = str(e)
        if "NSFW_DETECTED" in error_msg:
            print(f"[WARN] Analysis rejected due to NSFW content")
            raise HTTPException(
                status_code=422,
                detail="系统检测到图片包含敏感或违规内容，根据安全规范无法进行分析。"
            )
            
        print(f"[ERROR] AI analysis failed: {e}")
        # Explicitly fail the request if AI analysis errors out
        raise HTTPException(
            status_code=422,
            detail="AI分析服务暂时不可用或分析失败，请重试。"
        )

    # --- Validation Start ---
    # Check if critical fields exist. Data from AI might be partial or empty if generation failed.
    if not analysis_result or \
       not analysis_result.get("coreAnalysis") or \
       not analysis_result.get("artistInfo"):
        
        print(f"[ERROR] Analysis result validation failed: {analysis_result}")
        raise HTTPException(
            status_code=422,
            detail="AI分析未能生成有效报告，请重试或更换图片。"
        )
    # --- Validation End ---

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
        ),
        ArtworkAnalysis.is_deleted == 0
    ).order_by(ArtworkAnalysis.created_at.desc()).all()
    
    # Python 层面严格过滤无效数据
    valid_analyses = []
    for a in analyses:
        # 1. 检查 core_analysis 是否存在且为字典
        if not a.core_analysis or not isinstance(a.core_analysis, dict):
            continue
        # 2. 检查关键字段是否为空（防止空JSON {}）
        if not a.core_analysis.get("styleAndSchool") and not a.core_analysis.get("artisticValue"):
            continue
        # 3. 检查标题是否为模拟数据或为空
        if not a.title or a.title == "未知作品":
            continue
        valid_analyses.append(a)
    
    result = [_build_analysis_response(a, current_user, db) for a in valid_analyses]
    
    return {"success": True, "analyses": result}


@router.get("/discover", response_model=AnalysisListResponse)
def discover_analyses(
    search: Optional[str] = Query(None, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100, description="返回数量"),
    sort: str = Query("latest", regex="^(latest|popular|featured)$", description="排序方式"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    获取公开的分析列表
    支持搜索、分页和排序
    featured: 随机展示S级/A级精选作品
    """
    query = db.query(ArtworkAnalysis).filter(ArtworkAnalysis.is_deleted == 0)
    
    # 搜索过滤
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (ArtworkAnalysis.title.like(search_pattern)) |
            (ArtworkAnalysis.artist.like(search_pattern)) |
            (ArtworkAnalysis.style.like(search_pattern))
        )
    
    # 过滤无效数据 (SQL层面不再过滤，改为Python层面严格过滤)
    # query = query.filter(...) 
    
    # 排序策略
    if sort == "featured":
        # 精选模式：逻辑稍复杂
        # 1. 获取一个较大的候选池（例如最近500条或点赞前500条），在内存中筛选S级
        candidate_limit = 500
        # 优先取有点赞的，质量可能更高
        query = query.order_by(ArtworkAnalysis.likes.desc(), ArtworkAnalysis.created_at.desc())
        analyses = query.limit(candidate_limit).all()
        
        # 2. Python 层面筛选 + 验证
        s_tier = []
        a_tier = []
        others = []
        
        for a in analyses:
            # 基础验证
            if not a.core_analysis or not isinstance(a.core_analysis, dict): continue
            if not a.core_analysis.get("styleAndSchool") and not a.core_analysis.get("artisticValue"): continue
            if not a.title or a.title == "未知作品": continue
            
            # 评级筛选
            rating = None
            if a.investment_analysis and isinstance(a.investment_analysis, dict):
                rating = a.investment_analysis.get("rating")
            
            if rating == 'S':
                s_tier.append(a)
            elif rating == 'A':
                a_tier.append(a)
            else:
                others.append(a)
        
        # 3. 组装结果：优先S，不够补A，不够补其他
        # 随机打乱以保证每次刷新不同
        random.shuffle(s_tier)
        random.shuffle(a_tier)
        random.shuffle(others)
        
        featured_list = s_tier
        if len(featured_list) < limit:
            featured_list += a_tier[:(limit - len(featured_list))]
        if len(featured_list) < limit:
            featured_list += others[:(limit - len(featured_list))]
            
        # 最终再次打乱混合展示（可选，或者保持S在前的顺序，这里选择打乱让用户感觉丰富）
        random.shuffle(featured_list)
        valid_analyses = featured_list

    elif sort == "popular":
        query = query.order_by(ArtworkAnalysis.likes.desc())
        analyses = query.limit(limit).all()
        valid_analyses = _filter_valid_analyses(analyses)
    else:
        # latest
        query = query.order_by(ArtworkAnalysis.created_at.desc())
        analyses = query.limit(limit).all()
        valid_analyses = _filter_valid_analyses(analyses)

    # discover 接口不需要用户认证，传入 None (UPDATED: 现在传入 user 以支持部分查看模式)
    result = [_build_analysis_response(a, current_user, db) for a in valid_analyses]
    return {"success": True, "analyses": result}


def _filter_valid_analyses(analyses):
    """提取通用的过滤逻辑"""
    valid = []
    for a in analyses:
        # 1. 检查 core_analysis 是否存在且为字典
        if not a.core_analysis or not isinstance(a.core_analysis, dict):
            continue
        # 2. 检查关键字段是否为空
        if not a.core_analysis.get("styleAndSchool") and not a.core_analysis.get("artisticValue"):
            continue
        # 3. 检查标题是否为模拟数据或为空
        if not a.title or a.title == "未知作品":
            continue
        valid.append(a)
    return valid


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
        image_data = base64.b64decode(base64_str)
        
        # Determine media type from header
        media_type = "image/jpeg"
        if "png" in header:
            media_type = "image/png"
        elif "webp" in header:
            media_type = "image/webp"

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
    image_endpoint = f"/api/analysis/{analysis.id}/image"
    
    # 游客模式数据脱敏/锁定
    artist_info = analysis.artist_info
    investment_analysis = analysis.investment_analysis
    
    if not current_user:
        # 如果未登录，隐藏高级分析数据
        artist_info = None
        investment_analysis = None
    
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
        artistInfo=artist_info,
        investmentAnalysis=investment_analysis,
        imageUrl=image_endpoint,
        likes=analysis.likes,
        authorName=author.name if author else None,
        authorAvatar=author.avatar_url if author else None,
        isSaved=is_saved
    )
