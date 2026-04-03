from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List  # Bắt buộc phải import List để nhận nhiều file
from datetime import datetime
from app.services.image_processing import detect_and_crop_banknotes 
from app.services.ai_debate import run_consensus_system # Hoặc import từ core.py tùy bạn đang dùng file nào
from app.security import get_current_user
from app.database import history_collection 

router = APIRouter(prefix="/api")

@router.post("/analyze")
async def analyze_banknotes(
    files: List[UploadFile] = File(...), # SỬA Ở ĐÂY: Nhận 'files' dạng mảng
    current_user: str = Depends(get_current_user) 
):
    if not files:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên")
    
    try:
        all_cropped_banknotes = []
        filenames = []
        
        # 1. Lặp qua TẤT CẢ các ảnh người dùng gửi lên
        for file in files:
            if not file.content_type.startswith("image/"):
                continue # Bỏ qua nếu không phải hình ảnh
                
            image_bytes = await file.read()
            # OpenCV tự động cắt các tờ tiền trong ảnh này
            cropped_banknotes = detect_and_crop_banknotes(image_bytes)
            
            # Gộp các tờ tiền vừa cắt vào danh sách tổng
            all_cropped_banknotes.extend(cropped_banknotes)
            filenames.append(file.filename)

        if len(all_cropped_banknotes) == 0:
             raise HTTPException(status_code=400, detail="Ảnh không hợp lệ hoặc quá mờ.")

        # 2. Đưa toàn bộ các tờ tiền vào hệ thống Tranh biện AI
        all_results = []
        for i, note_bytes in enumerate(all_cropped_banknotes):
            print(f"Đang phân tích đối tượng thứ {i+1}/{len(all_cropped_banknotes)}...")
            result = run_consensus_system(note_bytes) 
            all_results.append(result)
            
        final_response = {
            "total_files_uploaded": len(files),
            "total_detected": len(all_cropped_banknotes),
            "results": all_results
        }
        
        # 3. Lưu vào MongoDB Lịch sử
        history_record = {
            "username": current_user,
            "filename": ", ".join(filenames), # Gộp tên các file thành 1 chuỗi để hiển thị lịch sử
            "timestamp": datetime.now().isoformat(),
            "results": final_response 
        }
        history_collection.insert_one(history_record)
        
        return final_response
        
    except Exception as e:
        print(f"Lỗi hệ thống: {e}")
        raise HTTPException(status_code=500, detail=str(e))