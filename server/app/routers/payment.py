import os
import random
import urllib.parse # Thêm thư viện xử lý chữ
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.database import payments_collection, users_collection, token_history_collection, packages_collection
from app.security import get_current_user

router = APIRouter(prefix="/api/payment", tags=["Payment"])

# ==========================================
# CẤU HÌNH BẢO MẬT THANH TOÁN
# ==========================================
SECRET_XOR_KEY = 0x5EAFB # Key bảo mật từ tài liệu thiết kế
NAME_WEB = "BANKNOTE"

def encode_payment_id(p_id: int) -> str:
    """ Mã hóa ID thật thành mã HEX ngẫu nhiên """
    return hex(p_id ^ SECRET_XOR_KEY)[2:].upper()

def decode_payment_id(hex_str: str) -> int:
    """ Giải mã HEX về lại ID thật """
    return int(hex_str, 16) ^ SECRET_XOR_KEY

# ==========================================
# 1. TẠO HÓA ĐƠN & MÃ QR (ĐÃ KẾT NỐI .ENV)
# ==========================================
@router.post("/create")
async def create_payment(amount_vnd: int, tokens_to_add: int, current_user = Depends(get_current_user)):
    username = current_user.get("username") if isinstance(current_user, dict) else current_user
    
    # 1. Tạo ID ngẫu nhiên cho hóa đơn
    p_id = random.randint(10000, 999999)
    
    # 2. Mã hóa bằng XOR để tạo nội dung chuyển khoản
    hex_id = encode_payment_id(p_id)
    content = f"{NAME_WEB}NAPTOKEN{hex_id}"
    
    # 3. Lưu vào Database
    payment_record = {
        "payment_id": p_id,
        "hex_id": hex_id,
        "username": username,
        "amount_vnd": amount_vnd,
        "tokens_expected": tokens_to_add,
        "content_transfer": content,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    payments_collection.insert_one(payment_record)
    
    # 4. LẤY THÔNG TIN TỪ FILE .ENV
    bank_id = os.getenv("BANK_ID", "VCB")
    account_no = os.getenv("BANK_ACCOUNT_NUMBER", "1031506356")
    raw_name = os.getenv("ACCOUNT_NAME", "HUYNH_NGUYEN_MINH_TRIET").replace("_", " ")
    account_name = urllib.parse.quote(raw_name)
    
    # 5. Tạo link QR Code (Dùng VietQR)
    qr_url = f"https://img.vietqr.io/image/{bank_id}-{account_no}-compact2.png?amount={amount_vnd}&addInfo={content}&accountName={account_name}"
    
    return {
        "payment_id": p_id, 
        "amount": amount_vnd,
        "content": content,
        "qr_url": qr_url,
        "bank_id": bank_id,
        "account_no": account_no,
        "account_name": raw_name
    }

# ==========================================
# 2. LẤY TRẠNG THÁI HÓA ĐƠN (POLLING)
# ==========================================
@router.get("/status/{payment_id}")
async def check_payment_status(payment_id: int, current_user = Depends(get_current_user)):
    payment = payments_collection.find_one({"payment_id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Hóa đơn không tồn tại")
    return {"status": payment["status"]}

# ==========================================
# 3. LẤY DANH SÁCH GÓI NẠP 
# ==========================================
@router.get("/packages")
async def get_public_packages():
    packages = list(packages_collection.find({}))
    if not packages:
        default_pkgs = [
            {"name": "Trải Nghiệm", "price": 10000, "tokens": 20, "features": "20 lượt giám định AI,Tốc độ tiêu chuẩn,Phân tích 3 chuyên gia", "popular": False},
            {"name": "Phổ Thông", "price": 20000, "tokens": 50, "features": "50 lượt giám định AI,Ưu tiên xử lý nhanh,Xuất báo cáo PDF", "popular": True},
            {"name": "Chuyên Gia", "price": 50000, "tokens": 150, "features": "150 lượt AI nhanh nhất,Lưu trữ không giới hạn,Hỗ trợ 24/7", "popular": False}
        ]
        packages_collection.insert_many(default_pkgs)
        packages = list(packages_collection.find({}))
        
    for p in packages:
        p["_id"] = str(p["_id"])
    return {"packages": packages}

# ==========================================
# 4. GIẢ LẬP THANH TOÁN (MOCK WEBHOOK CHO ĐỒ ÁN)
# ==========================================
@router.post("/mock-success/{payment_id}")
async def mock_payment_success(payment_id: int):
    """ API này dùng để test không cần chuyển khoản thật """
    payment = payments_collection.find_one({"payment_id": payment_id})
    if not payment or payment["status"] == "completed":
        return {"message": "Hóa đơn đã hoàn thành hoặc không tồn tại"}

    # Đổi trạng thái hóa đơn
    payments_collection.update_one(
        {"payment_id": payment_id},
        {"$set": {"status": "completed", "sepay_tx_id": "MOCK_TEST_123", "paid_at": datetime.now().isoformat()}}
    )
    
    # Cộng Token
    tokens_added = payment["tokens_expected"]
    users_collection.update_one(
        {"username": payment["username"]},
        {"$inc": {"token_balance": tokens_added}}
    )
    
    # Ghi log lịch sử
    token_history_collection.insert_one({
        "username": payment["username"],
        "type": "in",
        "amount": tokens_added,
        "description": f"Thanh toán gói Token (Mã: {payment['hex_id']})",
        "created_at": datetime.now().isoformat()
    })
    
    return {"status": "completed", "tokens_added": tokens_added}