import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.limiter import limiter # Nhập khiên từ file limiter.py
from app.routers import auth, analyze, history, payment, admin

app = FastAPI()

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