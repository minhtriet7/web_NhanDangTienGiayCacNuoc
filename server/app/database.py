# File: app/database.py
from pymongo import MongoClient

# Kết nối tới MongoDB
mongo_client = MongoClient("mongodb://localhost:27017/") 
db = mongo_client["banknote_ai_db"]        

# Khai báo các bảng (Collections)
users_collection = db["users"]              
history_collection = db["analysis_history"]
payments_collection = db["payments"]
token_history_collection = db["token_history"]
packages_collection = db["packages"]
feedback_collection = db["feedback"]
tickets_collection = db["tickets"]

# BẢNG MỚI ĐƯỢC THÊM VÀO ĐỂ CHỐNG TRÀN RAM:
tasks_collection = db["tasks"]