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
# HỆ THỐNG PROMPT ĐA TÁC NHÂN
# ==========================================
PROMPT_GEMINI_ART = """
Bạn là Chuyên gia Mỹ thuật & Hình ảnh tiền tệ. Hãy phân tích hình ảnh tờ tiền này.
CHỈ TẬP TRUNG VÀO: Chân dung, phong cảnh, kiến trúc, màu sắc chủ đạo. Bỏ qua các dòng chữ.

QUY TẮC ĐIỀN THÔNG TIN:
- quoc_gia: Tên quốc gia. Nếu không rõ ghi "Không xác định".
- menh_gia: Ghi con số mệnh giá. Nếu không rõ ghi "Không xác định".
- nam_phat_hanh: Ghi năm. Nếu không rõ ghi "Không xác định".
- chat_lieu: Polymer, Giấy, hoặc Cotton.
- mat_truoc: Mô tả chân dung/cảnh chính.
- mat_sau: Mô tả phong cảnh/kiến trúc.

CHỈ TRẢ VỀ ĐÚNG MỘT KHỐI JSON NHƯ SAU, KHÔNG GIẢI THÍCH GÌ THÊM:
{
    "quoc_gia": "...",
    "menh_gia": "...",
    "nam_phat_hanh": "...",
    "chat_lieu": "...",
    "mat_truoc": "...",
    "mat_sau": "..."
}
"""

PROMPT_QWEN_TEXT = """
Bạn là Chuyên gia Ngôn ngữ & Dịch thuật. Hãy phân tích hình ảnh tờ tiền này.
CHỈ TẬP TRUNG VÀO: Đọc chính xác các con số, chữ cái, ngôn ngữ.

QUY TẮC ĐIỀN THÔNG TIN:
- quoc_gia: Đọc chữ để đoán quốc gia (VD: Việt Nam, Mỹ). Nếu không đọc được ghi "Không xác định".
- menh_gia: Trích xuất số tiền và chữ ghi mệnh giá.
- nam_phat_hanh: Tìm năm in trên tiền (nếu có).
- chat_lieu: Ghi "Không xác định".
- mat_truoc: Trích xuất các dòng chữ/số quan trọng.
- mat_sau: Trích xuất các dòng chữ/số quan trọng.

CHỈ TRẢ VỀ ĐÚNG MỘT KHỐI JSON NHƯ SAU, KHÔNG GIẢI THÍCH GÌ THÊM:
{
    "quoc_gia": "...",
    "menh_gia": "...",
    "nam_phat_hanh": "...",
    "chat_lieu": "...",
    "mat_truoc": "...",
    "mat_sau": "..."
}
"""

PROMPT_LLAMA_LOGIC = """
Bạn là Chuyên gia Lịch sử & Nhận diện biểu tượng. Hãy phân tích hình ảnh tờ tiền này.
CHỈ TẬP TRUNG VÀO: Quốc huy, cờ, biểu tượng quốc gia, con dấu.

QUY TẮC ĐIỀN THÔNG TIN:
- quoc_gia: Dự đoán quốc gia dựa trên biểu tượng/quốc huy.
- menh_gia: Nhận diện số mệnh giá.
- nam_phat_hanh: Tìm năm in trên tiền (nếu có).
- chat_lieu: Dự đoán Giấy hoặc Polymer.
- mat_truoc: Mô tả biểu tượng chính trị/quốc huy.
- mat_sau: Mô tả sự kiện lịch sử/công trình.

CHỈ TRẢ VỀ ĐÚNG MỘT KHỐI JSON NHƯ SAU, KHÔNG GIẢI THÍCH GÌ THÊM:
{
    "quoc_gia": "...",
    "menh_gia": "...",
    "nam_phat_hanh": "...",
    "chat_lieu": "...",
    "mat_truoc": "...",
    "mat_sau": "..."
}
"""

def process_image_safe(img_data):
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
# PHASE 1: CÁC HÀM GỌI API VISION
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
# PHASE 2 & 3: CÁC HÀM TRANH BIỆN VÀ TỔNG HỢP
# ==========================================
def call_debate_agent(agent_role, original_json, peers_context):
    debate_prompt = f"""
    Bạn đang đóng vai: {agent_role} trong một hội đồng giám định tiền tệ.
    Đây là kết quả quan sát ban đầu của bạn (JSON): {original_json}
    Hãy đọc kết quả chéo từ 2 đồng nghiệp dưới đây: {peers_context}
    
    NHIỆM VỤ CỦA BẠN:
    1. So sánh kết quả của bạn với đồng nghiệp. Tự sửa sai nếu họ đúng hơn.
    2. Nếu thông tin thiếu, hãy lấy từ đồng nghiệp.
    3. Trả về kết quả cuối cùng dưới định dạng JSON chuẩn.
    
    {{
        "quoc_gia": "...", "menh_gia": "...", "nam_phat_hanh": "...",
        "chat_lieu": "...", "mat_truoc": "...", "mat_sau": "..."
    }}
    CHỈ TRẢ VỀ JSON. KHÔNG DÙNG MARKDOWN BLOCK.
    """
    try:
        # ### 🟢 ĐỔI MODEL VỊ TRÍ 2 (AI Tranh Biện - Groq) ###
        # Khuyên dùng: llama-3.3-70b-versatile (Rất thông minh & Miễn phí)
        res = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": debate_prompt}],
            temperature=0.2
        )
        return clean_json(res.choices[0].message.content)
    except Exception as e: 
        return json.dumps({"error": "Lỗi Debate Agent"})

def final_judge_groq(json_1, json_2, json_3):
    prompt_tong_hop = f"""
    Bạn là Thẩm định viên Trưởng. Dưới đây là 3 báo cáo JSON ĐÃ QUA TRANH BIỆN:
    - Mỹ thuật: {json_1}
    - Ngôn ngữ: {json_2}
    - Lịch sử: {json_3}

    NHIỆM VỤ: Tổng hợp thành Báo Cáo Chính Thức duy nhất bằng tiếng Việt.
    ĐỊNH DẠNG MARKDOWN YÊU CẦU:
    ### Kết Luận Giám Định
    [Câu tóm tắt]

    * **Quốc gia**: ...
    * **Mệnh giá**: ...
    * **Năm phát hành**: ...
    * **Chất liệu**: ...
    * **Mặt trước**: ...
    * **Mặt sau**: ...

    ---
    *Ghi chú của Thẩm định viên:* [Nhận xét mức độ đồng thuận]
    """
    try:
        # ### 🟢 ĐỔI MODEL VỊ TRÍ 3 (Trọng tài Tổng hợp - Groq) ###
        res = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt_tong_hop}],
            temperature=0.2
        )
        return res.choices[0].message.content
    except Exception as e: 
        return f"Lỗi tổng hợp: {str(e)}"

# ==========================================
# LUỒNG ĐIỀU PHỐI CHÍNH (PIPELINE)
# ==========================================
def run_consensus_system(image):
    clean_bytes, b64_string = process_image_safe(image)
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        f_gemini = executor.submit(call_gemini_vision, clean_bytes, PROMPT_GEMINI_ART)
        
        
        f_qwen = executor.submit(call_openrouter_vision, b64_string, "qwen/qwen-2-vl-7b-instruct", PROMPT_QWEN_TEXT)
        f_llama = executor.submit(call_openrouter_vision, b64_string, "meta-llama/llama-3.2-11b-vision-instruct", PROMPT_LLAMA_LOGIC)
        
        try: kq_gemini_init = f_gemini.result(timeout=60)
        except: kq_gemini_init = '{"error": "Gemini Timeout"}'
            
        try: kq_qwen_init = f_qwen.result(timeout=60)
        except: kq_qwen_init = '{"error": "Qwen Timeout"}'
            
        try: kq_llama_init = f_llama.result(timeout=60)
        except: kq_llama_init = '{"error": "Llama Timeout"}'

    # Báo lỗi nếu API sập
    if '"error"' in kq_gemini_init and '"error"' in kq_qwen_init and '"error"' in kq_llama_init:
        raise Exception("Tất cả API AI đều lỗi!")

    context_for_debate = f"- Mỹ thuật: {kq_gemini_init}\n- Ngôn ngữ: {kq_qwen_init}\n- Lịch sử: {kq_llama_init}"
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        f_debate_gemini = executor.submit(call_debate_agent, "Mỹ thuật", kq_gemini_init, context_for_debate)
        f_debate_qwen = executor.submit(call_debate_agent, "Ngôn ngữ", kq_qwen_init, context_for_debate)
        f_debate_llama = executor.submit(call_debate_agent, "Lịch sử", kq_llama_init, context_for_debate)
        
        try: kq_gemini_final = f_debate_gemini.result(timeout=45)
        except: kq_gemini_final = '{"error": "Debate Gemini Timeout"}'
            
        try: kq_qwen_final = f_debate_qwen.result(timeout=45)
        except: kq_qwen_final = '{"error": "Debate Qwen Timeout"}'
            
        try: kq_llama_final = f_debate_llama.result(timeout=45)
        except: kq_llama_final = '{"error": "Debate Llama Timeout"}'

    bao_cao_cuoi = final_judge_groq(kq_gemini_final, kq_qwen_final, kq_llama_final)
    
    # ⚠️ QUAN TRỌNG: Không được đổi tên các key (gemini, openrouter, groq) dưới đây
    # Vì Frontend React (Dashboard.jsx) đang dùng các tên này để hiển thị!
    return {
        "gemini": kq_gemini_final,
        "openrouter": kq_qwen_final, 
        "groq": kq_llama_final,        
        "final_report": bao_cao_cuoi
    }