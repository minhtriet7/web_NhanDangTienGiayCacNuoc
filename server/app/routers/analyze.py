# File: app/analyze.py
import uuid
import time
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

from app.services.image_processing import detect_and_crop_banknotes 
from app.services.ai_debate import run_consensus_system 
from app.security import get_current_user

from app.database import history_collection, feedback_collection, users_collection, token_history_collection, tasks_collection 
from app.limiter import limiter

router = APIRouter()

# ==========================================
# 1. HÀM XỬ LÝ NỀN (BACKGROUND WORKER)
# ==========================================
def background_ai_task(task_id: str, files_data: list, username: str):
    print(f"▶️ Bắt đầu xử lý task: {task_id} cho user: {username}")
    try:
        all_cropped_banknotes = []
        filenames = []
        
        # BƯỚC 1: CẮT ẢNH
        print("⏳ Đang cắt ảnh (OpenCV)...")
        for filename, image_bytes in files_data:
            cropped_banknotes = detect_and_crop_banknotes(image_bytes)
            all_cropped_banknotes.extend(cropped_banknotes)
            filenames.append(filename)

        if len(all_cropped_banknotes) == 0:
            print("❌ Lỗi: OpenCV không tìm thấy ảnh hợp lệ.")
            tasks_collection.update_one({"task_id": task_id}, {"$set": {"status": "failed", "detail": "Ảnh không hợp lệ hoặc quá mờ."}})
            users_collection.update_one({"username": username}, {"$inc": {"token_balance": 1}})
            token_history_collection.insert_one({
                "username": username, "type": "in", "amount": 1,
                "description": "Hoàn Token (Ảnh mờ/Lỗi)", "created_at": datetime.now().isoformat()
            })
            return

        print(f"✅ Đã cắt được {len(all_cropped_banknotes)} tờ tiền/xu. Chuyển cho AI...")

        # BƯỚC 2: GỌI AI GIÁM ĐỊNH (MULTI-AGENT)
        all_results = []
        for i, note_bytes in enumerate(all_cropped_banknotes):
            print(f"⏳ AI đang soi đối tượng {i+1}/{len(all_cropped_banknotes)}...")
            result = run_consensus_system(note_bytes) 
            all_results.append(result)
            
        final_response = {
            "total_files_uploaded": len(files_data),
            "total_detected": len(all_cropped_banknotes),
            "results": all_results
        }
        
        # BƯỚC 3: LƯU LỊCH SỬ VÀ BÁO CÁO THÀNH CÔNG
        history_record = {
            "username": username,
            "filename": ", ".join(filenames), 
            "timestamp": datetime.now().isoformat(),
            "results": final_response 
        }
        history_collection.insert_one(history_record)

        print(f"✅ Xử lý xong task {task_id}. Lưu trạng thái 'done' vào MongoDB.")
        tasks_collection.update_one({"task_id": task_id}, {"$set": {"status": "done", "data": final_response}})
        
    except Exception as e:
        print(f"❌ Lỗi cực nặng trong Background Task: {str(e)}")
        tasks_collection.update_one({"task_id": task_id}, {"$set": {"status": "failed", "detail": f"Hệ thống nội bộ gặp sự cố: {str(e)}"}})
        # HOÀN LẠI TOKEN DO LỖI SERVER
        users_collection.update_one({"username": username}, {"$inc": {"token_balance": 1}})

# ==========================================
# 2. API NHẬN YÊU CẦU
# ==========================================
@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_banknotes(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...), 
    current_user = Depends(get_current_user) 
):

    username = current_user.get("username") if isinstance(current_user, dict) else current_user

    user_db = users_collection.find_one({"username": username})
    if not user_db or user_db.get("token_balance", 0) <= 0:
        raise HTTPException(status_code=402, detail="Bạn đã hết Token. Vui lòng nạp thêm!")

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

    # TRỪ TOKEN
    users_collection.update_one({"username": username}, {"$inc": {"token_balance": -1}})
    token_history_collection.insert_one({
        "username": username,
        "type": "out",
        "amount": 1,
        "description": f"Giám định {len(files_data)} ảnh bằng AI",
        "created_at": datetime.now().isoformat()
    })

    # TẠO TASK MỚI TRONG MONGODB
    task_id = str(uuid.uuid4())
    tasks_collection.insert_one({
        "task_id": task_id, 
        "status": "processing", 
        "timestamp": time.time(),
        "username": username
    })

    print(f"📥 Đã nhận yêu cầu quét ảnh. Khởi tạo task: {task_id}")

    # Đưa vào hàng chờ chạy ngầm
    background_tasks.add_task(background_ai_task, task_id, files_data, username)
    return {"task_id": task_id, "message": "Hệ thống đang xử lý..."}


@router.get("/analyze/status/{task_id}")
async def check_task_status(task_id: str, current_user = Depends(get_current_user)):
    """API được Frontend gọi liên tục mỗi 3 giây để kiểm tra trạng thái"""
    task = tasks_collection.find_one({"task_id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task không tồn tại hoặc đã bị xóa")
    return task


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