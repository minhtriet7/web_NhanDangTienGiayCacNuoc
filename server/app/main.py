import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager

from app.limiter import limiter
from app.routers import auth, analyze, history, payment, admin
from app.database import tasks_collection, users_collection # Import Database

# ==========================================
# HÀM DỌN DẸP BÓNG MA KHI KHỞI ĐỘNG SERVER
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Chạy khi Server vừa bật lên (Startup)
    print("\n🧹 ĐANG DỌN DẸP DỮ LIỆU CŨ...")
    
    # Tìm tất cả các Task đang bị kẹt ở trạng thái 'processing'
    stuck_tasks = list(tasks_collection.find({"status": "processing"}))
    
    if stuck_tasks:
        print(f"👻 Phát hiện {len(stuck_tasks)} tiến trình bị kẹt (Bóng ma). Đang tiêu diệt...")
        
        for task in stuck_tasks:
            # Chuyển trạng thái thành failed
            tasks_collection.update_one(
                {"_id": task["_id"]}, 
                {"$set": {"status": "failed", "detail": "Tiến trình bị gián đoạn do Server khởi động lại."}}
            )
            # Hoàn lại Token cho người dùng bị oan
            if "username" in task:
                users_collection.update_one({"username": task["username"]}, {"$inc": {"token_balance": 1}})
                
        print("✅ Dọn dẹp xong! Hoàn lại Token thành công.\n")
    else:
        print("✅ Database sạch sẽ, không có tiến trình kẹt.\n")

    yield # Nhường quyền cho Server chạy

    # 2. Chạy khi Server tắt (Shutdown) - Hiện tại chưa cần làm gì
    pass

app = FastAPI(lifespan=lifespan) # Gắn hàm dọn dẹp vào App

# Gắn Limiter vào ứng dụng FastAPI
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payment.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(admin.router)
app.include_router(analyze.router, prefix="/api", tags=["Analyze API"])

@app.get("/")
def kiem_tra_server():
    return {"status": "✅ Server đang chạy với Clean Architecture (Đã bật Anti-Spam)!"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)