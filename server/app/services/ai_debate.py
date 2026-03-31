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

# ==========================================
# KHỞI TẠO KẾT NỐI API
# ==========================================
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)
gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def clean_json(text):
    text = text.strip()
    if text.startswith("```json"): 
        text = text[7:]
    elif text.startswith("```"): 
        text = text[3:]
    if text.endswith("```"): 
        text = text[:-3]
    return text.strip()

# ==========================================
# HỆ THỐNG PROMPT ĐA TÁC NHÂN BẤT ĐỐI XỨNG
# ==========================================

# 1. Chuyên gia Mỹ thuật (Gemini)
PROMPT_GEMINI_ART = """
Bạn là Chuyên gia Mỹ thuật & Hình ảnh tiền tệ. Hãy phân tích hình ảnh tờ tiền này.
CHỈ TẬP TRUNG VÀO: Chân dung, phong cảnh, kiến trúc, màu sắc chủ đạo, họa tiết động/thực vật. Bỏ qua các dòng chữ nhỏ.
Trả về kết quả dưới dạng JSON BẮT BUỘC sau:
{
    "quoc_gia": "Dự đoán quốc gia dựa trên phong cách mỹ thuật/nhân vật",
    "menh_gia": "Không xác định",
    "nam_phat_hanh": "Không xác định",
    "chat_lieu": "Dự đoán chất liệu qua bề mặt (Polymer/Giấy/Cotton)",
    "mat_truoc": "Mô tả chi tiết nhân vật/hình ảnh mặt trước",
    "mat_sau": "Mô tả chi tiết phong cảnh/hình ảnh mặt sau"
}
CHỈ TRẢ VỀ JSON. KHÔNG GIẢI THÍCH THÊM. KHÔNG DÙNG MARKDOWN BLOCK.
"""

# 2. Chuyên gia Ngôn ngữ (Qwen-VL)
PROMPT_QWEN_TEXT = """
Bạn là Chuyên gia Ngôn ngữ & Dịch thuật siêu cấp. Hãy phân tích hình ảnh tờ tiền này.
CHỈ TẬP TRUNG VÀO: Đọc chính xác các con số, chữ cái, xác định ngôn ngữ và hệ chữ (Latin, Ả Rập, Hán tự, Cyrillic...).
Trả về kết quả dưới dạng JSON BẮT BUỘC sau:
{
    "quoc_gia": "Dự đoán quốc gia dựa trên ngôn ngữ đọc được",
    "menh_gia": "Số tiền và chữ ghi mệnh giá",
    "nam_phat_hanh": "Tìm năm in trên tiền (nếu có)",
    "chat_lieu": "Không xác định",
    "mat_truoc": "Trích xuất các dòng chữ/số quan trọng mặt trước",
    "mat_sau": "Trích xuất các dòng chữ/số quan trọng mặt sau"
}
CHỈ TRẢ VỀ JSON. KHÔNG GIẢI THÍCH THÊM. KHÔNG DÙNG MARKDOWN BLOCK.
"""

# 3. Chuyên gia Logic & Lịch sử (Llama Vision)
PROMPT_LLAMA_LOGIC = """
Bạn là Chuyên gia Lịch sử & Nhận diện biểu tượng. Hãy phân tích hình ảnh tờ tiền này.
CHỈ TẬP TRUNG VÀO: Quốc huy, cờ, biểu tượng quốc gia, con dấu, hoặc thiết kế tổng thể.
Trả về kết quả dưới dạng JSON BẮT BUỘC sau:
{
    "quoc_gia": "Dự đoán quốc gia dựa trên biểu tượng/quốc huy",
    "menh_gia": "Nhận diện số mệnh giá lớn nhất",
    "nam_phat_hanh": "Không xác định",
    "chat_lieu": "Giấy / Polymer",
    "mat_truoc": "Mô tả biểu tượng chính trị/quốc huy/dấu mộc",
    "mat_sau": "Mô tả sự kiện lịch sử hoặc công trình đặc trưng"
}
CHỈ TRẢ VỀ JSON. KHÔNG GIẢI THÍCH THÊM. KHÔNG DÙNG MARKDOWN BLOCK.
"""

# ==========================================
# KHỐI XỬ LÝ ẢNH CHUẨN (THREAD-SAFE)
# ==========================================
# ==========================================
# KHỐI XỬ LÝ ẢNH CHUẨN (THREAD-SAFE)
# ==========================================
def process_image_safe(img_data):
    # CHUYỂN BYTES THÀNH PIL IMAGE Ở NGAY ĐÂY
    if isinstance(img_data, bytes):
        img = Image.open(BytesIO(img_data))
    else:
        img = img_data

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
# PHASE 1: TRÍCH XUẤT ĐỘC LẬP (VISION API)
# ==========================================
def call_gemini_vision(clean_bytes, prompt):
    try:
        safe_img = Image.open(BytesIO(clean_bytes))
        res = gemini_client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=[prompt, safe_img]
        )
        return clean_json(res.text)
    except Exception as e: 
        return json.dumps({"error": f"Gemini Lỗi: {str(e)}"})

def call_openrouter_vision(b64_string, model_name, prompt):
    try:
        res = openrouter_client.chat.completions.create(
            model=model_name,
            messages=[{
                "role": "user", 
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_string}"}}
                ]
            }],
            temperature=0.1
        )
        if not getattr(res, 'choices', None) or len(res.choices) == 0:
             return json.dumps({"error": f"{model_name} không trả về kết quả."})
        return clean_json(res.choices[0].message.content)
    except Exception as e: 
        return json.dumps({"error": f"{model_name} Lỗi: {str(e)}"})

# ==========================================
# PHASE 2: PHÒNG TRANH BIỆN (TEXT API)
# ==========================================
def call_debate_agent(agent_role, original_json, peers_context):
    debate_prompt = f"""
    Bạn đang đóng vai: {agent_role} trong một hội đồng giám định tiền tệ.
    
    Đây là kết quả quan sát ban đầu của bạn (JSON):
    {original_json}

    Hãy đọc kết quả chéo từ 2 đồng nghiệp của bạn (Chuyên gia Ngôn ngữ, Mỹ thuật, Lịch sử) dưới đây:
    {peers_context}

    NHIỆM VỤ CỦA BẠN:
    1. So sánh kết quả của bạn với đồng nghiệp. Nếu họ phát hiện ra ngôn ngữ hoặc biểu tượng rõ ràng hơn chứng minh cho một quốc gia khác, hãy tự sửa sai.
    2. Nếu thông tin của bạn bị thiếu (Ví dụ: "Không xác định"), hãy mạnh dạn lấy thông tin hợp lý từ đồng nghiệp để điền vào.
    3. Trả về kết quả cuối cùng của bạn dưới định dạng JSON chuẩn.
    
    {{
        "quoc_gia": "...",
        "menh_gia": "...",
        "nam_phat_hanh": "...",
        "chat_lieu": "...",
        "mat_truoc": "...",
        "mat_sau": "..."
    }}
    CHỈ TRẢ VỀ JSON. KHÔNG DÙNG MARKDOWN BLOCK.
    """
    try:
        res = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": debate_prompt}],
            temperature=0.2
        )
        return clean_json(res.choices[0].message.content)
    except Exception as e: 
        return json.dumps({"error": "Lỗi Debate Agent"})

# ==========================================
# PHASE 3: TRỌNG TÀI TỔNG HỢP
# ==========================================
def final_judge_groq(json_1, json_2, json_3):
    prompt_tong_hop = f"""
    Bạn là Thẩm định viên Trưởng. Dưới đây là 3 báo cáo JSON ĐÃ QUA TRANH BIỆN từ 3 AI:
    - Chuyên gia Mỹ thuật (Gemini): {json_1}
    - Chuyên gia Ngôn ngữ (Qwen): {json_2}
    - Chuyên gia Lịch sử (Llama): {json_3}

    NHIỆM VỤ:
    Tổng hợp thành Báo Cáo Chính Thức duy nhất bằng tiếng Việt. Mọi thông tin cần là sự đồng thuận cao nhất từ 3 chuyên gia.
    
    ĐỊNH DẠNG MARKDOWN YÊU CẦU:
    ### Kết Luận Giám Định
    [Một câu tóm tắt ngắn gọn xác nhận quốc gia và mệnh giá]

    * **Quốc gia**: ...
    * **Mệnh giá**: ...
    * **Năm phát hành**: ...
    * **Chất liệu**: ...
    * **Mặt trước**: ...
    * **Mặt sau**: ...

    ---
    *Ghi chú của Thẩm định viên:* [Nhận xét ngắn gọn 1-2 câu về mức độ đồng thuận của các AI sau khi tranh biện]
    """
    try:
        res = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt_tong_hop}],
            temperature=0.2
        )
        return res.choices[0].message.content
    except Exception as e: 
        return f"Lỗi tổng hợp từ Thẩm định viên: {str(e)}"

# ==========================================
# LUỒNG ĐIỀU PHỐI CHÍNH (PIPELINE)
# ==========================================
def run_consensus_system(image):
    print("🤖 Đang chuẩn bị dữ liệu ảnh (Thread-safe)...")
    clean_bytes, b64_string = process_image_safe(image)
    
    # --- PHASE 1: TRÍCH XUẤT ĐỘC LẬP ---
    print("👁️ PHASE 1: Các chuyên gia đang phân tích độc lập...")
    with concurrent.futures.ThreadPoolExecutor() as executor:
        f_gemini = executor.submit(call_gemini_vision, clean_bytes, PROMPT_GEMINI_ART)
        f_qwen = executor.submit(call_openrouter_vision, b64_string, "qwen/qwen-2-vl-7b-instruct", PROMPT_QWEN_TEXT)
        f_llama = executor.submit(call_openrouter_vision, b64_string, "meta-llama/llama-3.2-11b-vision-instruct", PROMPT_LLAMA_LOGIC)
        
        kq_gemini_init = f_gemini.result()
        kq_qwen_init = f_qwen.result()
        kq_llama_init = f_llama.result()

    # --- PHASE 2: PHÒNG TRANH BIỆN (DEBATE) ---
    print("🗣️ PHASE 2: Kích hoạt Vòng Tranh Biện (Debate Room)...")
    context_for_debate = f"""
    [BÁO CÁO CỦA CÁC ĐỒNG NGHIỆP]
    - Chuyên gia Mỹ thuật thấy: {kq_gemini_init}
    - Chuyên gia Ngôn ngữ thấy: {kq_qwen_init}
    - Chuyên gia Lịch sử thấy: {kq_llama_init}
    """
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        f_debate_gemini = executor.submit(call_debate_agent, "Chuyên gia Mỹ thuật", kq_gemini_init, context_for_debate)
        f_debate_qwen = executor.submit(call_debate_agent, "Chuyên gia Ngôn ngữ", kq_qwen_init, context_for_debate)
        f_debate_llama = executor.submit(call_debate_agent, "Chuyên gia Lịch sử", kq_llama_init, context_for_debate)
        
        kq_gemini_final = f_debate_gemini.result()
        kq_qwen_final = f_debate_qwen.result()
        kq_llama_final = f_debate_llama.result()

    # --- PHASE 3: TRỌNG TÀI TỔNG HỢP ---
    print("⚖️ PHASE 3: Trọng tài Groq đang tổng hợp kết quả cuối cùng...")
    bao_cao_cuoi = final_judge_groq(kq_gemini_final, kq_qwen_final, kq_llama_final)
    
    return {
        "gemini": kq_gemini_final,
        "openrouter": kq_qwen_final, 
        "groq": kq_llama_final,        
        "final_report": bao_cao_cuoi
    }