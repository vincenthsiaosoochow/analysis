"""
艺术品分析相关的 Pydantic 模型
"""
from pydantic import BaseModel
from typing import Optional, List, Any, Dict, Union
from datetime import datetime


class CoreAnalysis(BaseModel):
    """核心艺术分析"""
    styleAndSchool: Optional[str] = None
    colorUsage: Optional[str] = None
    brushworkTexture: Optional[str] = None
    compositionLayout: Optional[str] = None
    themeAndMood: Optional[str] = None
    artisticValue: Optional[str] = None


class ArtistInfo(BaseModel):
    """艺术家信息"""
    basics: Optional[str] = None
    marketPosition: Optional[str] = None
    representativeWorks: Optional[Any] = None  # Could be str or List[str]
    styleEvolution: Optional[str] = None


class InvestmentAnalysis(BaseModel):
    """投资价值分析"""
    rating: Optional[str] = None  # S/A/B/C/D
    ratingReason: Optional[str] = None
    marketTrends: Optional[str] = None
    collectionAdvice: Optional[Any] = None  # Could be str or Dict
    riskAlert: Optional[Any] = None  # Could be str or Dict
    alternatives: Optional[Any] = None  # Could be str or List[str]


class ArtworkAnalysisResponse(BaseModel):
    """艺术品分析响应"""
    id: int
    title: str
    artist: str
    artistGender: Optional[str] = None
    style: Optional[str] = None
    period: Optional[str] = None
    origin: Optional[str] = None
    palette: Optional[Any] = None
    composition: Optional[str] = None
    interpretation: Optional[str] = None
    coreAnalysis: Optional[CoreAnalysis] = None
    artistInfo: Optional[ArtistInfo] = None
    investmentAnalysis: Optional[InvestmentAnalysis] = None
    imageUrl: str
    likes: int = 0
    authorName: Optional[str] = None
    authorAvatar: Optional[str] = None
    isSaved: Optional[bool] = False
    
    class Config:
        from_attributes = True


class AnalysisListResponse(BaseModel):
    """分析列表响应"""
    success: bool = True
    analyses: List[ArtworkAnalysisResponse]
