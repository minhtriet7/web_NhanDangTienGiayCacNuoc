from fastapi import APIRouter, Depends
from app.database import history_collection
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["History"])

@router.get("/history")
def lay_lich_su(current_user: str = Depends(get_current_user)):
    data = list(history_collection.find({"username": current_user}, {"_id": 0}).sort("timestamp", -1).limit(20))
    return {"history": data}