from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from typing import List, Optional
from datetime import datetime

from app.models.exhibition import Exhibition, UserExhibitionFavorite, ExhibitionStatus
from app.schemas.exhibition import ExhibitionCreate, ExhibitionUpdate

class ExhibitionService:
    @staticmethod
    def get_exhibitions(
        db: Session, 
        skip: int = 0, 
        limit: int = 20, 
        status: Optional[str] = None,
        city: Optional[str] = None,
        keyword: Optional[str] = None
    ) -> List[Exhibition]:
        from sqlalchemy.orm import defer
        # Defer cover_image for list views to improve performance
        query = db.query(Exhibition).options(defer(Exhibition.cover_image))

        if city:
            query = query.filter(Exhibition.city == city)
        
        if keyword:
            search = f"%{keyword}%"
            query = query.filter(
                or_(
                    Exhibition.title.like(search),
                    Exhibition.description.like(search),
                    Exhibition.venue.like(search),
                    Exhibition.city.like(search)
                )
            )

        # Status filtering needs to be done carefully or in memory if complex, 
        # but basic date comparison works well in SQL.
        now = datetime.now()
        if status:
            if status == "upcoming":  # 即将开始
                query = query.filter(Exhibition.start_date > now)
            elif status == "ongoing": # 进行中
                query = query.filter(and_(Exhibition.start_date <= now, Exhibition.end_date >= now))
            elif status == "ended":   # 已结束
                query = query.filter(Exhibition.end_date < now)

        # Default sort by start_date desc
        query = query.order_by(desc(Exhibition.start_date))
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_exhibition(db: Session, exhibition_id: int) -> Optional[Exhibition]:
        return db.query(Exhibition).filter(Exhibition.id == exhibition_id).first()

    @staticmethod
    def create_exhibition(db: Session, exhibition: ExhibitionCreate) -> Exhibition:
        db_exhibition = Exhibition(**exhibition.model_dump())
        db.add(db_exhibition)
        db.commit()
        db.refresh(db_exhibition)
        return db_exhibition

    @staticmethod
    def update_exhibition(
        db: Session, exhibition_id: int, exhibition_update: ExhibitionUpdate
    ) -> Optional[Exhibition]:
        db_exhibition = ExhibitionService.get_exhibition(db, exhibition_id)
        if not db_exhibition:
            return None
        
        update_data = exhibition_update.model_dump(exclude_unset=True)
        
        # CRITICAL FIX: Prevent overwriting actual image data with the lazy-loading URL.
        # When frontend sends back the Exhibition object, it contains the generated URL 
        # (e.g., /api/exhibitions/1/cover-image?v=...) instead of the underlying Base64/real URL.
        # If we save this back to DB, we lose the image data and create a broken self-referencing loop.
        if "cover_image" in update_data:
            cover_val = update_data["cover_image"]
            # Check if it looks like our lazy-load URL
            if cover_val and isinstance(cover_val, str) and "/api/exhibitions/" in cover_val and "/cover-image" in cover_val:
                # Remove it so we keep the existing value in DB
                del update_data["cover_image"]

        for key, value in update_data.items():
            setattr(db_exhibition, key, value)
        
        db.commit()
        db.refresh(db_exhibition)
        return db_exhibition

    @staticmethod
    def delete_exhibition(db: Session, exhibition_id: int) -> bool:
        db_exhibition = ExhibitionService.get_exhibition(db, exhibition_id)
        if not db_exhibition:
            return False
        
        db.delete(db_exhibition)
        db.commit()
        return True

    @staticmethod
    def toggle_favorite(db: Session, user_id: int, exhibition_id: int) -> bool:
        """
        Toggle favorite status. Returns True if favorited, False if unfavorited.
        """
        favorite = db.query(UserExhibitionFavorite).filter(
            UserExhibitionFavorite.user_id == user_id,
            UserExhibitionFavorite.exhibition_id == exhibition_id
        ).first()

        if favorite:
            db.delete(favorite)
            db.commit()
            return False
        else:
            new_favorite = UserExhibitionFavorite(user_id=user_id, exhibition_id=exhibition_id)
            db.add(new_favorite)
            db.commit()
            return True

    @staticmethod
    def get_user_favorites(db: Session, user_id: int) -> List[Exhibition]:
        return db.query(Exhibition).join(UserExhibitionFavorite).filter(
            UserExhibitionFavorite.user_id == user_id
        ).order_by(desc(UserExhibitionFavorite.created_at)).all()
    
    @staticmethod
    def get_available_cities(db: Session) -> List[str]:
        """
        获取所有有展览的城市列表（去重）
        """
        cities = db.query(Exhibition.city).filter(Exhibition.city.isnot(None)).distinct().all()
        return [city[0] for city in cities if city[0]]
