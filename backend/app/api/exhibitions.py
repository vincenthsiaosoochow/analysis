from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    
    # If user is logged in, mark which ones are favorited
    # Note: This N+1 check is simple but could be optimized if needed
    if current_user:
        # Get all favorited IDs for this user
        favorites = ExhibitionService.get_user_favorites(db, current_user.id)
        fav_ids = {fav.id for fav in favorites}
        
        # We need to return schema objects with is_favorited set
        results = []
        for ex in exhibitions:
            # Manually converting to schema to set extra field
            # Pydantic via 'from_attributes' usually works but we need to inject is_favorited
            ex_data = ExhibitionOut.model_validate(ex)
            ex_data.is_favorited = ex.id in fav_ids
            results.append(ex_data)
        return results

    return exhibitions

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
