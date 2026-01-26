"""
艺术品分析相关的 Pydantic 模型
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CoreAnalysis(BaseModel):
    """核心艺术分析"""
    styleAndSchool: str
    colorUsage: str
    brushworkTexture: str
    compositionLayout: str
    themeAndMood: str
    artisticValue: str


class ArtistInfo(BaseModel):
    """艺术家信息"""
    basics: str
    marketPosition: str
    representativeWorks: str
    styleEvolution: str


class InvestmentAnalysis(BaseModel):
    """投资价值分析"""
    rating: str  # S/A/B/C/D
    ratingReason: str
    marketTrends: str
    collectionAdvice: str
    riskAlert: str
    alternatives: str


class ArtworkAnalysisResponse(BaseModel):
    """艺术品分析响应"""
    id: int
    title: str
    artist: str
    artistGender: Optional[str] = None
    style: Optional[str] = None
    period: Optional[str] = None
    origin: Optional[str] = None
    palette: Optional[List[str]] = None
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
