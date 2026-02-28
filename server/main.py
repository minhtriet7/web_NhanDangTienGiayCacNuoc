import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image

# Import cái hàm "não bộ" từ file core.py
from core import run_consensus_system 

app = FastAPI()

# --- CẤU HÌNH BẢO MẬT (CORS) ---
# Bắt buộc phải có để trang Web React (cổng 5173) có thể gọi sang Server (cổng 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Mở cửa cho tất cả mọi người truy cập
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CÁC ĐƯỜNG DẪN API (ENDPOINTS) ---

@app.get("/")
def kiem_tra_server():
    return {"status": "✅ Server Python đang chạy ngon lành!"}

@app.post("/api/analyze")
async def nhan_dien_tien(file: UploadFile = File(...)):
    print(f"\n📥 Đã nhận được yêu cầu phân tích ảnh: {file.filename}")
    
    try:
        # 1. Đọc dữ liệu ảnh từ Web gửi lên
        contents = await file.read()
        
        # 2. Chuyển dữ liệu thô thành định dạng Ảnh (PIL Image) để core.py hiểu được
        image = Image.open(BytesIO(contents))
        
        # 3. Chuyển ảnh cho 3 chuyên gia AI phân tích
        print("🤖 Đang nhờ AI xử lý... (Vui lòng đợi vài giây)")
        ket_qua = run_consensus_system(image)
        
        print("✅ Đã có kết quả! Đang gửi về cho Web React.")
        return ket_qua

    except Exception as e:
        print(f"❌ Lỗi hệ thống: {str(e)}")
        return {"error": f"Lỗi Server: {str(e)}"}

# --- LỆNH KHỞI ĐỘNG SERVER ---
if __name__ == "__main__":
    # Chạy server ở cổng 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

