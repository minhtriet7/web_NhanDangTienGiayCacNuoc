import uuid
import time
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

from app.services.image_processing import detect_and_crop_banknotes 
from app.services.ai_debate import run_consensus_system 
from app.security import get_current_user

# ĐÃ BỔ SUNG users_collection VÀ token_history_collection
from app.database import history_collection, feedback_collection, users_collection, token_history_collection 
from app.limiter import limiter

router = APIRouter()

# ==========================================
# BỘ NHỚ TẠM (IN-MEMORY) ĐỂ LƯU TRẠNG THÁI TASK
# ==========================================
task_results = {}

# ==========================================
# HÀM XỬ LÝ NỀN (BACKGROUND WORKER)
# ==========================================
def background_ai_task(task_id: str, files_data: list, current_user: str):
    try:
        all_cropped_banknotes = []
        filenames = []
        
        for filename, image_bytes in files_data:
            cropped_banknotes = detect_and_crop_banknotes(image_bytes)
            all_cropped_banknotes.extend(cropped_banknotes)
            filenames.append(filename)

        if len(all_cropped_banknotes) == 0:
             task_results[task_id] = {"status": "failed", "detail": "Ảnh không hợp lệ hoặc quá mờ."}
             return

        all_results = []
        for i, note_bytes in enumerate(all_cropped_banknotes):
            result = run_consensus_system(note_bytes) 
            all_results.append(result)
            
        final_response = {
            "total_files_uploaded": len(files_data),
            "total_detected": len(all_cropped_banknotes),
            "results": all_results
        }
        
        # 1. Lưu lịch sử quét ảnh (Cho tab Lịch sử)
        history_record = {
            "username": current_user,
            "filename": ", ".join(filenames), 
            "timestamp": datetime.now().isoformat(),
            "results": final_response 
        }
        history_collection.insert_one(history_record)

        # ========================================================
        # MỚI: 2. TRỪ TOKEN VÀ GHI LOG ĐỂ ADMIN LÊN BIỂU ĐỒ
        # ========================================================
        # Trừ 1 token của user đó trong Database
        users_collection.update_one({"username": current_user}, {"$inc": {"token_balance": -1}})
        
        # Ghi log "out" (Tiêu thụ token) vào Database
        token_history_collection.insert_one({
            "username": current_user,
            "type": "out",
            "amount": 1,
            "description": f"Giám định {len(files_data)} ảnh bằng AI",
            "created_at": datetime.now().isoformat()
        })
        # ========================================================
        
        task_results[task_id] = {
            "status": "done", 
            "data": final_response
        }
        
    except Exception as e:
        print(f"Lỗi Background Task: {e}")
        task_results[task_id] = {"status": "failed", "detail": str(e)}

# ==========================================
# API 1: NHẬN YÊU CẦU VÀ TRẢ VỀ TASK_ID
# ==========================================
@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_banknotes(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...), 
    current_user: str = Depends(get_current_user) 
):
    if not files:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên")
    
    files_data = []
    for f in files:
        if not f.content_type.startswith("image/"):
            continue
        bytes_data = await f.read()
        files_data.append((f.filename, bytes_data))
        
    if not files_data:
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận định dạng hình ảnh")

    task_id = str(uuid.uuid4())
    task_results[task_id] = {"status": "processing", "timestamp": time.time()}
    background_tasks.add_task(background_ai_task, task_id, files_data, current_user)
    return {"task_id": task_id, "message": "Hệ thống đang xử lý..."}

# ==========================================
# API 2: FRONTEND GỌI ĐỂ KIỂM TRA TRẠNG THÁI
# ==========================================
@router.get("/analyze/status/{task_id}")
async def check_task_status(task_id: str, current_user: str = Depends(get_current_user)):
    if task_id not in task_results:
        raise HTTPException(status_code=404, detail="Task không tồn tại hoặc đã hết hạn")
    return task_results[task_id]

# ==========================================
# API 3: TIẾP NHẬN FEEDBACK TỪ NGƯỜI DÙNG
# ==========================================
class FeedbackModel(BaseModel):
    task_id: str
    ai_result: str
    is_correct: bool
    user_correction: str = ""

@router.post("/analyze/feedback")
async def submit_feedback(feedback: FeedbackModel, current_user = Depends(get_current_user)):
    username = current_user.get("username") if isinstance(current_user, dict) else current_user
    feedback_data = {
        "task_id": feedback.task_id,
        "username": username,
        "ai_result": feedback.ai_result,
        "is_correct": feedback.is_correct,
        "user_correction": feedback.user_correction,
        "created_at": datetime.now().isoformat()
    }
    feedback_collection.insert_one(feedback_data)
    return {"message": "Cảm ơn bạn đã đóng góp dữ liệu!"}