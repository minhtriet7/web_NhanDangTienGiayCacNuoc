from slowapi import Limiter
from slowapi.util import get_remote_address

# Khởi tạo bộ đếm Rate Limit
limiter = Limiter(key_func=get_remote_address)