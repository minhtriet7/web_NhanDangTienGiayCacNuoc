import os
import base64
import json
import concurrent.futures
from io import BytesIO
from dotenv import load_dotenv
from groq import Groq
from openai import OpenAI
from google import genai 
from PIL import Image, ImageFile 

# Cho phép Pillow đọc các ảnh bị thiếu vài byte cuối
ImageFile.LOAD_TRUNCATED_IMAGES = True 

load_dotenv()

# --- KHỞI TẠO KẾT NỐI API ---
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)
gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

COMMON_PROMPT = """
Bạn là chuyên gia giám định tiền tệ. Hãy phân tích hình ảnh tờ tiền này và trả về kết quả dưới dạng JSON BẮT BUỘC như sau:
{
    "quoc_gia": "Tên quốc gia",
    "menh_gia": "Mệnh giá (Số và Chữ)",
    "nam_phat_hanh": "(Tìm năm phát hành nếu có, nếu không tìm được thì để 'Không xác định')",
    "chat_lieu": "Cotton / Polymer / Giấy",
    "mat_truoc": "Mô tả ngắn gọn hình ảnh/nhân vật chính mặt trước",
    "mat_sau": "Mô tả ngắn gọn hình ảnh/phong cảnh chính mặt sau"
}
CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH THÊM. KHÔNG DÙNG MARKDOWN BLOCK.
"""

def clean_json(text):
    text = text.strip()
    if text.startswith("```json"): text = text[7:]
    elif text.startswith("```"): text = text[3:]
    if text.endswith("```"): text = text[:-3]
    return text.strip()

# ==========================================
# KHỐI XỬ LÝ ẢNH CHUẨN (CHẠY 1 LẦN DUY NHẤT)
# ==========================================
def process_image_safe(img):
    """
    Xử lý ảnh ở luồng chính để tránh lỗi Thread-Safe của PIL.
    Trả về (clean_bytes, base64_string) an toàn cho đa luồng.
    """
    try:
        img.load()
    except:
        pass

    img_copy = img.copy()
    img_copy.thumbnail((800, 800)) 
    if img_copy.mode in ("RGBA", "P"): 
        img_copy = img_copy.convert("RGB")
        
    buffered = BytesIO()
    img_copy.save(buffered, format="JPEG", quality=70)
    
    clean_bytes = buffered.getvalue()
    b64_string = base64.b64encode(clean_bytes).decode("utf-8")
    
    return clean_bytes, b64_string


# ==========================================
# CÁC HÀM GỌI AI THUẦN TÚY (LẤY DỮ LIỆU ĐÃ XỬ LÝ)
# ==========================================

# 1. GEMINI: Lấy chuỗi Bytes sạch và tự tạo instance độc lập
def call_gemini(clean_bytes):
    try:
        # Tạo đối tượng Image mới hoàn toàn độc lập trong luồng này
        safe_img = Image.open(BytesIO(clean_bytes))
        res = gemini_client.models.generate_content(
            model='gemini-2.5-flash', 
            #model='gemini-2.5-flash-lite', 
            
            contents=[COMMON_PROMPT, safe_img]
        )
        return clean_json(res.text)
    except Exception as e:
        return json.dumps({"error": f"Gemini Lỗi: {str(e)}"})

# 2. QWEN: Lấy chuỗi Base64
def call_openrouter_llama_vision(b64_string):
    try:
        res = openrouter_client.chat.completions.create(
            model="qwen/qwen-2-vl-7b-instruct",
            #model="qwen/qwen2.5-vl-72b-instruct",
            
            messages=[{
                "role": "user", 
                "content": [
                    {"type": "text", "text": COMMON_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_string}"}}
                ]
            }],
            temperature=0
        )
        if not getattr(res, 'choices', None) or len(res.choices) == 0:
             return json.dumps({"error": "Qwen Lỗi: OpenRouter không trả về kết quả."})
        return clean_json(res.choices[0].message.content)
    except Exception as e:
        return json.dumps({"error": f"Qwen Lỗi Hệ Thống: {str(e)}"})

# 3. LLAMA VISION (Dự phòng cho Nemotron): Lấy chuỗi Base64
def call_openrouter_nemotron(b64_string):
    try:
        res = openrouter_client.chat.completions.create(
            model="meta-llama/llama-3.2-11b-vision-instruct",
            #model="nvidia/nemotron-nano-12b-v2-vl:free",
           
             #model="mistralai/pixtral-12b:free",                     # Dự phòng 1: Pixtral (Mistral)
             
            messages=[{
                "role": "user", 
                "content": [
                    {"type": "text", "text": COMMON_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_string}"}}
                ]
            }],
            temperature=0.1
        )
        if not getattr(res, 'choices', None) or len(res.choices) == 0:
             return json.dumps({"error": "Llama 11B Lỗi: OpenRouter không trả về kết quả."})
        return clean_json(res.choices[0].message.content)
    except Exception as e:
        return json.dumps({"error": f"Llama 11B Lỗi Hệ Thống: {str(e)}"})


# ==========================================
# TRỌNG TÀI TỔNG HỢP (GROQ)
# ==========================================
def final_judge_groq(json_gemini, json_llama, json_nemo):
    prompt_tong_hop = f"""
    Bạn là Thẩm định viên Cao cấp. Dưới đây là 3 báo cáo JSON từ 3 AI Vision khác nhau về cùng 1 tờ tiền:
    - Chuyên gia 1 (Gemini): {json_gemini}
    - Chuyên gia 2 (Qwen): {json_llama}
    - Chuyên gia 3 (Llama Vision): {json_nemo}

    NHIỆM VỤ:
    1. Loại bỏ các báo cáo chứa lỗi (error).
    2. So sánh các báo cáo hợp lệ. Nếu có thông tin mâu thuẫn, hãy chọn thông tin được đa số các chuyên gia đồng ý.
    3. Tổng hợp thành một Báo Cáo Chính Thức duy nhất bằng tiếng Việt.
    
    ĐỊNH DẠNG BÁO CÁO MARKDOWN:
    ### Kết Luận Giám Định
    [Một câu tóm tắt ngắn gọn về độ tin cậy của kết quả]

    * **Quốc gia**: ...
    * **Mệnh giá**: ...
    * **Năm phát hành**: ...
    * **Chất liệu**: ...
    * **Mặt trước**: ...
    * **Mặt sau**: ...

    ---
    *Ghi chú của Trọng tài:* [Nhận xét ngắn gọn về các lỗi nếu có]
    """
    try:
        res = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt_tong_hop}],
            temperature=0.2
        )
        return res.choices[0].message.content
    except Exception as e:
        return f"Lỗi tổng hợp từ Trọng tài Groq: {str(e)}"

# ==========================================
# LUỒNG ĐIỀU PHỐI CHÍNH (ĐÃ CHỐNG DEADLOCK)
# ==========================================
def run_consensus_system(image):
    print("🤖 Đang chuẩn bị dữ liệu ảnh (Thread-safe)...")
    
    # Ép xử lý ảnh 1 lần duy nhất để lấy định dạng an toàn
    clean_bytes, b64_string = process_image_safe(image)
    
    print("🤖 Đang nhờ 3 chuyên gia Vision phân tích ảnh CÙNG LÚC...")
    
    # Chạy đa luồng bằng các dữ liệu an toàn
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_gemini = executor.submit(call_gemini, clean_bytes)
        future_llama = executor.submit(call_openrouter_llama_vision, b64_string)
        future_nemo = executor.submit(call_openrouter_nemotron, b64_string)
        
        kq_gemini = future_gemini.result()
        kq_llama = future_llama.result()
        kq_nemo = future_nemo.result()
    
    print("⚖️ Trọng tài Groq đang tổng hợp kết quả...")
    bao_cao_cuoi = final_judge_groq(kq_gemini, kq_llama, kq_nemo)
    
    return {
        "gemini": kq_gemini,
        "openrouter": kq_llama, 
        "groq": kq_nemo,        
        "final_report": bao_cao_cuoi
    }