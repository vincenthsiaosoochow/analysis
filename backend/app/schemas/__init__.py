"""
schemas 包初始化
"""
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    PasswordReset,
    UserResponse,
    LoginResponse
)
from app.schemas.artwork import (
    CoreAnalysis,
    ArtistInfo,
    InvestmentAnalysis,
    ArtworkAnalysisResponse,
    AnalysisListResponse
)

__all__ = [
    "UserRegister",
    "UserLogin",
    "PasswordReset",
    "UserResponse",
    "LoginResponse",
    "CoreAnalysis",
    "ArtistInfo",
    "InvestmentAnalysis",
    "ArtworkAnalysisResponse",
    "AnalysisListResponse"
]
