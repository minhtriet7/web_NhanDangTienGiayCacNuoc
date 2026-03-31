# File: app/database.py
from pymongo import MongoClient

# Kết nối tới MongoDB
mongo_client = MongoClient("mongodb://localhost:27017/") 
db = mongo_client["banknote_ai_db"]        

# Khai báo các bảng (Collections)
users_collection = db["users"]              
history_collection = db["analysis_history"]