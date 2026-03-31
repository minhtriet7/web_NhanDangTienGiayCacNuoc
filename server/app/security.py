import os
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database import users_collection
from dotenv import load_dotenv

# Tải các biến môi trường từ file .env
load_dotenv()

# Lấy cấu hình từ .env, có giá trị mặc định để tránh lỗi nếu quên cấu hình
SECRET_KEY = os.getenv("SECRET_KEY", "khoa_bi_mat_mac_dinh_rat_dai_va_kho_doan") 
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token có hiệu lực trong 1 ngày

# Sử dụng pbkdf2_sha256 thay vì bcrypt để tránh lỗi thiếu thư viện C++ trên Windows
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Đường dẫn này phải khớp với đường dẫn API đăng nhập của bạn
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password, hashed_password):
    """Kiểm tra mật khẩu người dùng nhập có khớp với bản băm trong DB không"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Mã hóa mật khẩu trước khi lưu vào Database"""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """Tạo mã thông báo JWT (vé thông hành) cho người dùng"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Hàm kiểm tra Token. 
    Dùng làm 'tấm khiên' bảo vệ các API yêu cầu đăng nhập.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Token không hợp lệ"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ"
        )
    
    user = users_collection.find_one({"username": username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Không tìm thấy người dùng trên hệ thống"
        )
    return user["username"]


