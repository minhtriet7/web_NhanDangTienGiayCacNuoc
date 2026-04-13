import os
import httpx
import random
import hashlib # Thư viện băm email để lấy Avatar
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime
from app.database import users_collection
from app.security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ==========================================
# CÁC MODEL DỮ LIỆU
# ==========================================
class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str
    email: str

class PasswordUpdate(BaseModel):
    new_password: str

class ProfileUpdate(BaseModel):
    full_name: str
    current_password: str = ""
    new_password: str = ""

class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    email: str
    otp: str
    new_password: str

# ==========================================
# HÀM HỖ TRỢ LẤY AVATAR TỰ ĐỘNG
# ==========================================
def get_gravatar_url(email: str):
    """ Tạo link Avatar tự động từ Email (Chuẩn thiết kế Hệ thống) """
    if not email: return ""
    email_hash = hashlib.md5(email.strip().lower().encode('utf-8')).hexdigest()
    return f"https://www.gravatar.com/avatar/{email_hash}?d=identicon"

# ==========================================
# API ĐĂNG KÝ / ĐĂNG NHẬP TRUYỀN THỐNG
# ==========================================
@router.post("/register")
def dang_ky(user: UserRegister):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại!")
    
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")
    
    hashed_password = get_password_hash(user.password)
    new_user = {
        "username": user.username,
        "password": hashed_password,
        "full_name": user.full_name,
        "email": user.email,
        "token_balance": 5, # 🎁 Tặng 5 token cho tài khoản mới
        "role": "user",
        "created_at": datetime.now().isoformat(),
        "auth_provider": "local"
    }
    users_collection.insert_one(new_user)
    return {"message": "Đăng ký thành công! Bạn được tặng 5 lượt giám định miễn phí."}

@router.post("/login")
def dang_nhap(form_data: OAuth2PasswordRequestForm = Depends()):
    # TỐI ƯU: Cho phép đăng nhập bằng cả Username HOẶC Email
    user = users_collection.find_one({
        "$or": [
            {"username": form_data.username}, 
            {"email": form_data.username}
        ]
    })
    
    if not user or not verify_password(form_data.password, user.get("password", "")):
        raise HTTPException(status_code=400, detail="Sai tài khoản, email hoặc mật khẩu")
    
    access_token = create_access_token(data={"sub": user["username"], "role": user.get("role", "user")})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "username": user["username"],
        "token_balance": user.get("token_balance", 0)
    }

# ==========================================
# API ĐĂNG NHẬP GOOGLE OAUTH 2.0
# ==========================================
@router.get("/google/login")
async def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = "http://localhost:8000/api/auth/google/callback"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"response_type=code&client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=openid%20email%20profile&access_type=offline"
    )
    return {"url": auth_url}

@router.get("/google/callback")
async def google_callback(code: str):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = "http://localhost:8000/api/auth/google/callback"
    frontend_url = "http://localhost:5173"

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        token_data = response.json()
        access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(status_code=400, detail="Không thể xác thực với Google")

    user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
    async with httpx.AsyncClient() as client:
        user_response = await client.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"})
        user_info = user_response.json()

    email = user_info.get("email")
    full_name = user_info.get("name")

    user = users_collection.find_one({"email": email})
    
    if not user:
        username = email.split("@")[0]
        if users_collection.find_one({"username": username}):
            username = f"{username}_{int(datetime.now().timestamp())}"
            
        user = {
            "username": username,
            "password": "", 
            "full_name": full_name,
            "email": email,
            "token_balance": 5, 
            "role": "user",
            "created_at": datetime.now().isoformat(),
            "auth_provider": "google"
        }
        users_collection.insert_one(user)

    sys_token = create_access_token(data={"sub": user["username"], "role": user.get("role", "user")})
    return RedirectResponse(url=f"{frontend_url}/login?token={sys_token}")

# ==========================================
# API HỖ TRỢ NGƯỜI DÙNG (PROFILE, QUÊN PASS)
# ==========================================
@router.post("/set-password")
def set_password(data: PasswordUpdate, current_user = Depends(get_current_user)):
    """ Cho phép tài khoản Google tạo mật khẩu để có thể đăng nhập tay """
    username = current_user.get("username") if isinstance(current_user, dict) else current_user
    
    hashed_pw = get_password_hash(data.new_password)
    users_collection.update_one(
        {"username": username},
        {"$set": {
            "password": hashed_pw, 
            "auth_provider": "google_and_local"
        }}
    )
    return {"message": "Thiết lập mật khẩu thành công!"}

@router.get("/me")
async def get_my_profile(current_user = Depends(get_current_user)):
    """ Trả về hồ sơ người dùng để hiển thị lên trang Profile và cấp quyền Admin """
    username = current_user.get("username") if isinstance(current_user, dict) else current_user
    
    user = users_collection.find_one({"username": username}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    # Gắn URL Avatar vào kết quả trả về
    user["avatar_url"] = get_gravatar_url(user.get("email", ""))
    
    return user

@router.put("/update-profile")
def update_profile(data: ProfileUpdate, current_user = Depends(get_current_user)):
    """ Cập nhật tên hiển thị và mật khẩu của người dùng """
    username = current_user.get("username") if isinstance(current_user, dict) else current_user
    user = users_collection.find_one({"username": username})
    
    update_data = {"full_name": data.full_name}

    if data.new_password:
        if user.get("auth_provider") == "google" and not user.get("password"):
            raise HTTPException(status_code=400, detail="Tài khoản Google chưa thiết lập mật khẩu, vui lòng tạo mật khẩu trước.")
            
        if not verify_password(data.current_password, user.get("password", "")):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng!")
            
        update_data["password"] = get_password_hash(data.new_password)

    users_collection.update_one({"username": username}, {"$set": update_data})
    return {"message": "Cập nhật hồ sơ thành công!"}

@router.post("/forgot-password")
def request_forgot_password(data: ForgotPasswordReq):
    """ Xử lý gửi OTP khôi phục mật khẩu """
    user = users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email không tồn tại trong hệ thống")
        
    otp_code = str(random.randint(100000, 999999))
    users_collection.update_one({"email": data.email}, {"$set": {"reset_otp": otp_code}})
    
    print(f"\n{'='*40}")
    print(f"🔥 [DEV MODE] YÊU CẦU QUÊN MẬT KHẨU 🔥")
    print(f"📧 Email: {data.email}")
    print(f"🔑 MÃ OTP CỦA BẠN LÀ: {otp_code}")
    print(f"{'='*40}\n")
    
    return {"message": "Mã OTP đã được gửi. (Kiểm tra Terminal Backend để lấy mã)"}

@router.post("/reset-password")
def confirm_reset_password(data: ResetPasswordReq):
    """ Xác nhận OTP và đặt lại mật khẩu """
    user = users_collection.find_one({"email": data.email})
    
    if not user or user.get("reset_otp") != data.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác hoặc đã hết hạn")
        
    hashed_pw = get_password_hash(data.new_password)
    
    users_collection.update_one(
        {"email": data.email},
        {
            "$set": {"password": hashed_pw, "auth_provider": "local"},
            "$unset": {"reset_otp": ""} 
        }
    )
    
    return {"message": "Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay."}
# 1. Thêm class này vào nếu ở trên chưa có
class AvatarUpdate(BaseModel):
    avatar_base64: str

# 2. Thêm API Upload Avatar này vào dưới cùng file auth.py
@router.post("/upload-avatar")
def upload_avatar(data: AvatarUpdate, current_user = Depends(get_current_user)):
    """ API nhận ảnh Base64 từ người dùng và lưu vào MongoDB """
    username = current_user.get("username") if isinstance(current_user, dict) else current_user
    users_collection.update_one(
        {"username": username},
        {"$set": {"avatar_url": data.avatar_base64}}
    )
    return {"message": "Cập nhật ảnh đại diện thành công!"}