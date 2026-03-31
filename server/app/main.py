import uvicorn # Thêm dòng này
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, analyze, history

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(history.router)

@app.get("/")
def kiem_tra_server():
    return {"status": "✅ Server đang chạy với Clean Architecture!"}

# THÊM ĐOẠN NÀY VÀO CUỐI FILE
if __name__ == "__main__":
    # Đặt reload=True để code tự cập nhật khi bạn bấm Save
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)