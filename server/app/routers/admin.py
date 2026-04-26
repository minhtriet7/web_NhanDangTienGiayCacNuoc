import os
import re
import math
import random
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from bson import ObjectId 
from pydantic import BaseModel

from app.database import users_collection, payments_collection, token_history_collection, packages_collection, tickets_collection, feedback_collection
from app.security import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ==========================================
# 1. API LẤY THỐNG KÊ TỔNG QUAN
# ==========================================
@router.get("/stats")
async def get_system_stats(current_user = Depends(get_current_user)):
    total_users = users_collection.count_documents({})
    
    revenue_cursor = payments_collection.aggregate([
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_vnd"}}}
    ])
    rev_list = list(revenue_cursor)
    total_revenue = rev_list[0]["total"] if rev_list else 0
    total_scans = token_history_collection.count_documents({"type": "out"})
    
    return {
        "total_users": total_users,
        "total_revenue": total_revenue,
        "total_scans": total_scans
    }

# ==========================================
# 2. LẤY DANH SÁCH NGƯỜI DÙNG (CÓ PHÂN TRANG)
# ==========================================
@router.get("/users")
async def get_all_users(page: int = 1, limit: int = 10, current_user = Depends(get_current_user)):
    skip = (page - 1) * limit
    total_users = users_collection.count_documents({})
    total_pages = math.ceil(total_users / limit) if total_users > 0 else 1
    
    users = []
    for u in users_collection.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).skip(skip).limit(limit):
        users.append(u)
        
    return {
        "users": users,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_users
        }
    }

# ==========================================
# 3. API BƠM/TRỪ TOKEN THỦ CÔNG
# ==========================================
@router.post("/add-token")
async def add_token_to_user(username: str, amount: int, current_user = Depends(get_current_user)):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    users_collection.update_one({"username": username}, {"$inc": {"token_balance": amount}})
    
    action_word = "Tặng" if amount > 0 else "Trừ"
    token_history_collection.insert_one({
        "username": username,
        "type": "in" if amount > 0 else "out",
        "amount": abs(amount),
        "description": f"Admin {action_word} Token thủ công",
        "created_at": datetime.now().isoformat()
    })
    return {"message": f"Đã {action_word.lower()} {abs(amount)} Token cho {username}"}

# ==========================================
# 4. QUẢN LÝ GÓI NẠP (CRUD PACKAGES)
# ==========================================
@router.get("/packages")
async def get_packages(current_user = Depends(get_current_user)):
    packages = list(packages_collection.find({}))
    for p in packages:
        p["_id"] = str(p["_id"])
    return packages

@router.post("/packages")
async def create_package(pkg: dict, current_user = Depends(get_current_user)):
    result = packages_collection.insert_one(pkg)
    return {"message": "Tạo gói thành công", "id": str(result.inserted_id)}

@router.delete("/packages/{pkg_id}")
async def delete_package(pkg_id: str, current_user = Depends(get_current_user)):
    packages_collection.delete_one({"_id": ObjectId(pkg_id)})
    return {"message": "Đã xóa gói"}

# ==========================================
# 5. LỊCH SỬ TOÀN HỆ THỐNG (CÓ PHÂN TRANG)
# ==========================================
@router.get("/all-history")
async def get_all_history(page: int = 1, limit: int = 15, current_user = Depends(get_current_user)):
    skip = (page - 1) * limit
    total_histories = token_history_collection.count_documents({})
    total_pages = math.ceil(total_histories / limit) if total_histories > 0 else 1
    
    histories = list(token_history_collection.find().sort("created_at", -1).skip(skip).limit(limit))
    for h in histories:
        h["_id"] = str(h["_id"])
        
    return {
        "histories": histories,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_histories
        }
    }

# ==========================================
# 6. HỆ THỐNG QUẢN LÝ SEO (GHI ĐÈ FILE HTML)
# ==========================================
class SEOUpdate(BaseModel):
    site_title: str
    description: str
    keywords: str
    author: str
    favicon_url: str

HTML_PATH = os.path.join(os.path.dirname(__file__), "../../../client/index.html")

@router.get("/seo")
async def get_current_seo(current_user = Depends(get_current_user)):
    if not os.path.exists(HTML_PATH):
        return {"error": "Không tìm thấy file index.html của Frontend"}
        
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    def extract_meta(name):
        match = re.search(fr'<meta\s+name=["\']{name}["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
        return match.group(1) if match else ""

    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    favicon_match = re.search(r'<link\s+rel=["\']icon["\'][^>]*?href=["\'](.*?)["\']', content, re.IGNORECASE)
    
    return {
        "site_title": title_match.group(1) if title_match else "Banknote AI",
        "description": extract_meta("description"),
        "keywords": extract_meta("keywords"),
        "author": extract_meta("author"),
        "favicon_url": favicon_match.group(1) if favicon_match else "/vite.svg"
    }

@router.post("/seo")
async def update_seo_html(data: SEOUpdate, current_user = Depends(get_current_user)):
    if not os.path.exists(HTML_PATH):
        raise HTTPException(status_code=404, detail=f"Không tìm thấy file {HTML_PATH}")
        
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r'<title>.*?</title>', f'<title>{data.site_title}</title>', content, flags=re.IGNORECASE)

    meta_maps = {
        "description": data.description,
        "keywords": data.keywords,
        "author": data.author
    }

    for key, value in meta_maps.items():
        if re.search(fr'<meta\s+name=["\']{re.escape(key)}["\']', content, re.IGNORECASE):
            pattern = fr'(<meta\s+name=["\']{re.escape(key)}["\']\s+content=["\']).*?(["\']\s*/?>)'
            content = re.sub(pattern, fr'\g<1>{value}\g<2>', content, flags=re.IGNORECASE)
        else:
            meta_tag = f'\n    <meta name="{key}" content="{value}">'
            content = re.sub(r'(<head>)', fr'\g<1>{meta_tag}', content, flags=re.IGNORECASE)

    if data.favicon_url:
        content = re.sub(r'(<link\s+rel=["\']icon["\'][^>]*?href=["\']).*?(["\'])', fr'\g<1>{data.favicon_url}\g<2>', content, flags=re.IGNORECASE)

    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(content)
        
    return {"message": "Cập nhật SEO vào file HTML thành công!"}

# ==========================================
# 7. HELPDESK - TẠO PHIẾU HỖ TRỢ (USER GỌI)
# ==========================================
class TicketModel(BaseModel):
    subject: str
    description: str
    device_log: str

@router.post("/support/ticket")
async def create_ticket(ticket: TicketModel, current_user = Depends(get_current_user)):
    username = current_user.get("username") if isinstance(current_user, dict) else current_user
    ticket_id = f"TCK-{random.randint(1000, 9999)}"
    
    ticket_data = {
        "ticket_id": ticket_id,
        "username": username,
        "subject": ticket.subject,
        "description": ticket.description,
        "device_log": ticket.device_log,
        "status": "Open",
        "created_at": datetime.now().isoformat()
    }
    tickets_collection.insert_one(ticket_data)
    return {"message": "Đã gửi phiếu hỗ trợ thành công!", "ticket_id": ticket_id}

# ==========================================
# 8. HELPDESK - LẤY DANH SÁCH PHIẾU (ADMIN GỌI)
# ==========================================
@router.get("/support/tickets")
async def get_all_tickets(page: int = 1, limit: int = 20, current_user = Depends(get_current_user)):
    skip = (page - 1) * limit
    tickets = list(tickets_collection.find().sort("created_at", -1).skip(skip).limit(limit))
    for t in tickets:
        t["_id"] = str(t["_id"])
    return {"tickets": tickets}

# ==========================================
# 9. LẤY DỮ LIỆU AI FEEDBACK (FIX LỖI 404)
# ==========================================
@router.get("/ai-feedback")
async def get_all_feedbacks(page: int = 1, limit: int = 50, current_user = Depends(get_current_user)):
    skip = (page - 1) * limit
    feedbacks = list(feedback_collection.find().sort("created_at", -1).skip(skip).limit(limit))
    for f in feedbacks:
        f["_id"] = str(f["_id"])
    return {"feedbacks": feedbacks}

# ==========================================
# 10. LẤY DỮ LIỆU BIỂU ĐỒ 7 NGÀY GẦN NHẤT
# ==========================================
@router.get("/chart-data")
async def get_chart_data(current_user = Depends(get_current_user)):
    today = datetime.now()
    chart_data = []
    
    day_map = {"Mon": "T2", "Tue": "T3", "Wed": "T4", "Thu": "T5", "Fri": "T6", "Sat": "T7", "Sun": "CN"}
    
    for i in range(6, -1, -1):
        date_target = today - timedelta(days=i)
        start_of_day = date_target.replace(hour=0, minute=0, second=0).isoformat()
        end_of_day = date_target.replace(hour=23, minute=59, second=59).isoformat()

        # Đếm số token (scans) bị trừ trong ngày
        scans_count = token_history_collection.count_documents({
            "type": "out",
            "created_at": {"$gte": start_of_day, "$lte": end_of_day}
        })

        chart_data.append({
            "date": date_target.strftime("%d/%m"),
            "day": day_map.get(date_target.strftime("%a"), ""),
            "scans": scans_count
        })

    return {"chart_data": chart_data}