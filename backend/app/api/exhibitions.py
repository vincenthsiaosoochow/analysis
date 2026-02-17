from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
import base64
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.schemas.exhibition import ExhibitionCreate, ExhibitionOut, ExhibitionUpdate
from app.services.exhibition_service import ExhibitionService
from app.utils.dependencies import get_current_user, get_current_user_optional, get_current_admin

router = APIRouter(
    prefix="/exhibitions",
    tags=["exhibitions"]
)

@router.get("/cities", response_model=List[str])
def get_available_cities(db: Session = Depends(get_db)):
    """
    获取所有有展览的城市列表
    """
    return ExhibitionService.get_available_cities(db)


@router.get("/", response_model=List[ExhibitionOut])
def get_exhibitions(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = Query(None, description="ongoing, upcoming, ended"),
    city: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)  # Optional auth to check favorites status
):
    exhibitions = ExhibitionService.get_exhibitions(db, skip, limit, status, city, keyword)
    
    # 标记收藏状态
    result = []
    favorited_ids = set()
    
    if current_user:
        # Get all favorited IDs for this user
        favorites = ExhibitionService.get_user_favorites(db, current_user.id)
        favorited_ids = {fav.id for fav in favorites}
    
    for ex in exhibitions:
        # 手动构建字典，避免 Pydantic model_validate 读取被 defer 的 cover_image 字段导致触发 SQL 查询 (N+1问题)
        # 获取除 cover_image 外的所有字段
        ex_dict = {
            "id": ex.id,
            "title": ex.title,
            "venue": ex.venue,
            "start_date": ex.start_date,
            "end_date": ex.end_date,
            "address": ex.address,
            "city": ex.city,
            "country": ex.country,
            "continent": ex.continent,
            "ticket_info": ex.ticket_info,
            "description": ex.description,
            "official_link": ex.official_link,
            "created_at": ex.created_at,
            "updated_at": ex.updated_at
        }
        
        # 性能优化：不再返回 Base64，而是返回图片 URL
        # 前端通过 <img src="..."> 懒加载图片，利用浏览器并发请求
        # 添加版本号防止缓存问题
        updated_ts = int(ex.updated_at.timestamp()) if ex.updated_at else 0
        ex_dict['cover_image'] = f"/api/exhibitions/{ex.id}/cover-image?v={updated_ts}"
        
        ex_dict['is_favorited'] = ex.id in favorited_ids
        result.append(ExhibitionOut(**ex_dict))
    
    return result

@router.get("/my/favorites", response_model=List[ExhibitionOut])
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exhibitions = ExhibitionService.get_user_favorites(db, current_user.id)
    # They are all favorited primarily
    results = []
    for ex in exhibitions:
        ex_data = ExhibitionOut.model_validate(ex)
        ex_data.is_favorited = True
        results.append(ex_data)
    return results

@router.get("/{exhibition_id}", response_model=ExhibitionOut)
def get_exhibition(
    exhibition_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    exhibition = ExhibitionService.get_exhibition(db, exhibition_id)
    if not exhibition:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    
    ex_data = ExhibitionOut.model_validate(exhibition)
    if current_user:
        favorites = ExhibitionService.get_user_favorites(db, current_user.id)
        fav_ids = {fav.id for fav in favorites}
        ex_data.is_favorited = exhibition.id in fav_ids
        
    return ex_data

@router.get("/{exhibition_id}/cover-image")
def get_exhibition_cover_image(
    exhibition_id: int,
    db: Session = Depends(get_db)
):
    """
    获取展览封面图 (Lazy Loading)
    支持 Base64 和 URL
    """
    from app.models.exhibition import Exhibition
    
    # Fetch only the cover_image field for performance
    # Note: db.query(Model.column) returns tuples, not model instances
    result = db.query(Exhibition.cover_image).filter(Exhibition.id == exhibition_id).first()
    
    if not result or not result[0]:
        # Return transparent 1x1 pixel if missing
        # base64 for 1x1 transparent gif
        TRANSPARENT_PIXEL = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        return Response(content=TRANSPARENT_PIXEL, media_type="image/gif")
    
    # Access the first element of the tuple
    content = result[0].strip()
    
    # Check if it is a URL (http, https, or relative)
    # But safeguard against self-referencing loops if DB already contains looking-like-self URL due to previous bug
    is_url = content.startswith("http") or content.startswith("//")
    # Only allow relative URL if it DOES NOT look like our own endpoint to avoid infinite loop
    # Current endpoint pattern: /api/exhibitions/{id}/cover-image
    if content.startswith("/"):
        if "/cover-image" in content and f"/exhibitions/{exhibition_id}/" in content:
            # This is a self-referencing loop from corrupted data. Return error or placeholder.
            # Returning transparent pixel to allow page load without error console spam, 
            # but it effectively means "image lost".
             return Response(content=TRANSPARENT_PIXEL, media_type="image/gif")
        is_url = True

    if is_url:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(content)

    try:
        # Data URI format: "data:image/jpeg;base64,....."
        if "," in content:
            header, base64_str = content.split(",", 1)
        else:
            header = ""
            base64_str = content
            
        # Clean up whitespace/newlines which might break b64decode
        base64_str = base64_str.strip()
        
        image_data = base64.b64decode(base64_str)
        
        # Optimize image size for mobile (max width 800px)
        try:
            from PIL import Image
            import io
            
            # Open image from bytes
            with Image.open(io.BytesIO(image_data)) as img:
                # Only resize if width > 800px
                if img.width > 800:
                    # Calculate new height
                    ratio = 800 / img.width
                    new_height = int(img.height * ratio)
                    
                    # Resize with high quality
                    # Use LANCZOS for downsampling
                    img = img.resize((800, new_height), Image.Resampling.LANCZOS)
                    
                    # Save to bytes
                    output = io.BytesIO()
                    # Convert RGBA to RGB if saving as JPEG
                    save_format = img.format if img.format else "JPEG"
                    if save_format == "JPEG" and img.mode == "RGBA":
                        img = img.convert("RGB")
                        
                    img.save(output, format=save_format, quality=85, optimize=True)
                    image_data = output.getvalue()
        except Exception as e:
            print(f"Image optimization failed via PIL (continuing with original): {e}")

        # Determine media type logic (unchanged or re-detected)
        # We can rely on original header logic or detect from PIL if needed, 
        # but original header logic is fine as we usually keep format.
        
        # Determine media type based on header primarily, or fallback
        media_type = "image/jpeg" # Default
        if "png" in header:
            media_type = "image/png"
        elif "webp" in header:
            media_type = "image/webp"
        elif "gif" in header:
            media_type = "image/gif"
            
        return Response(content=image_data, media_type=media_type, headers={
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*"
        })
    except Exception as e:
        print(f"Error serving exhibition image {exhibition_id}: {e}")
        # Return error image or 404
        raise HTTPException(status_code=500, detail="Image processing error")

@router.post("/", response_model=ExhibitionOut, status_code=status.HTTP_201_CREATED)
def create_exhibition(
    exhibition: ExhibitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return ExhibitionService.create_exhibition(db, exhibition)

@router.put("/{exhibition_id}", response_model=ExhibitionOut)
def update_exhibition(
    exhibition_id: int,
    exhibition: ExhibitionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    updated = ExhibitionService.update_exhibition(db, exhibition_id, exhibition)
    if not updated:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    return updated


@router.delete("/{exhibition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exhibition(
    exhibition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    success = ExhibitionService.delete_exhibition(db, exhibition_id)
    if not success:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    return None

@router.post("/{exhibition_id}/favorite")
def toggle_favorite(
    exhibition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exhibition = ExhibitionService.get_exhibition(db, exhibition_id)
    if not exhibition:
        raise HTTPException(status_code=404, detail="Exhibition not found")
        
    is_favorited = ExhibitionService.toggle_favorite(db, current_user.id, exhibition_id)
    return {"is_favorited": is_favorited}

# 批量删除
@router.post("/batch-delete")
def batch_delete_exhibitions(
    ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    count = 0
    for id in ids:
        if ExhibitionService.delete_exhibition(db, id):
            count += 1
    return {"deleted_count": count}
