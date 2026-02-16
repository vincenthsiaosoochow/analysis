from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime
from enum import Enum

class ExhibitionStatusEnum(str, Enum):
    UPCOMING = "即将开始"
    ONGOING = "进行中"
    ENDED = "已结束"

class ExhibitionBase(BaseModel):
    title: str
    cover_image: str
    venue: str
    start_date: datetime
    end_date: datetime
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    ticket_info: Optional[str] = None
    description: Optional[str] = None
    official_link: Optional[str] = None

class ExhibitionCreate(ExhibitionBase):
    pass

class ExhibitionUpdate(BaseModel):
    title: Optional[str] = None
    cover_image: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    ticket_info: Optional[str] = None
    description: Optional[str] = None
    official_link: Optional[str] = None

class ExhibitionOut(ExhibitionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: ExhibitionStatusEnum
    is_favorited: Optional[bool] = False  # For current user context

    class Config:
        from_attributes = True

    @property
    def status(self) -> ExhibitionStatusEnum:
        now = datetime.now()
        # 注意：这里的 datetime 比较需要注意时区，暂定为 naive datetime 比较（假设服务器和数据库统一时区）
        # 实际生产中建议统一使用 UTC
        if now < self.start_date:
            return ExhibitionStatusEnum.UPCOMING
        elif now > self.end_date:
            return ExhibitionStatusEnum.ENDED
        else:
            return ExhibitionStatusEnum.ONGOING
