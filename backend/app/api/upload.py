from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.utils.dependencies import get_current_admin
from app.services.storage_service import save_uploaded_image
from pydantic import BaseModel

router = APIRouter(
    prefix="/upload",
    tags=["upload"]
)

class UploadResponse(BaseModel):
    url: str

@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_admin)
):
    """
    上传图片 (仅管理员)
    返回 Base64 Data URI 或图片 URL
    """
    try:
        image_url, _ = await save_uploaded_image(file)
        return {"url": image_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
