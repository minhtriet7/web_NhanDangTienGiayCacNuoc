import os
import base64
import json
import concurrent.futures
from io import BytesIO
from dotenv import load_dotenv
from groq import Groq
from google import genai 
from PIL import Image, ImageFile 

ImageFile.LOAD_TRUNCATED_IMAGES = True 
load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
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
# HỆ THỐNG PROMPT QUỐC TẾ (SỬA LỖI ẢO GIÁC ĐỐI TƯỢNG)
# ==========================================
PROMPT_GEMINI_ART = """
Bạn là Chuyên gia Hình ảnh Tiền tệ Toàn cầu. Bức ảnh này có thể chứa 1 HOẶC NHIỀU tờ tiền.
Hãy nhận diện TẤT CẢ các tờ tiền bạn nhìn thấy. Bỏ qua các dòng chữ.

BẮT BUỘC TRẢ VỀ MỘT MẢNG JSON (ARRAY), MỖI TỜ TIỀN LÀ 1 PHẦN TỬ:
[
    {
        "quoc_gia": "Tên quốc gia", 
        "menh_gia": "Số mệnh giá", 
        "nam_phat_hanh": "Năm", 
        "chat_lieu": "Giấy (Cotton) hoặc Polymer", 
        "mat_truoc": "Mô tả chân dung", 
        "mat_sau": "Mô tả phong cảnh"
    }
]
"""

PROMPT_QWEN_TEXT = """
Bạn là Chuyên gia Ngôn ngữ Tiền tệ Quốc tế. Bức ảnh này có thể chứa 1 HOẶC NHIỀU tờ tiền.
Hãy đọc chính xác ngôn ngữ, con số, chữ cái trên TẤT CẢ các tờ tiền. Đếm kỹ các số 0 của mệnh giá.

BẮT BUỘC TRẢ VỀ MỘT MẢNG JSON (ARRAY), MỖI TỜ TIỀN LÀ 1 PHẦN TỬ:
[
    {
        "quoc_gia": "Dựa vào ngôn ngữ/tên ngân hàng để đoán", 
        "menh_gia": "Số tiền + Đơn vị", 
        "nam_phat_hanh": "Tìm năm in", 
        "chat_lieu": "Không xác định", 
        "mat_truoc": "Trích xuất chữ", 
        "mat_sau": "Trích xuất chữ"
    }
]
"""

PROMPT_LLAMA_LOGIC = """
Bạn là Chuyên gia Lịch sử & Biểu tượng Tiền tệ Thế giới. Bức ảnh này có thể chứa 1 HOẶC NHIỀU tờ tiền.
TẬP TRUNG VÀO: Quốc huy, cờ, biểu tượng quốc gia, ký hiệu tiền tệ.

BẮT BUỘC TRẢ VỀ MỘT MẢNG JSON (ARRAY), MỖI TỜ TIỀN LÀ 1 PHẦN TỬ:
[
    {
        "quoc_gia": "Dựa vào quốc huy/cờ", 
        "menh_gia": "Đếm kỹ số 0", 
        "nam_phat_hanh": "Tìm năm in", 
        "chat_lieu": "Đoán Giấy/Polymer", 
        "mat_truoc": "Mô tả quốc huy", 
        "mat_sau": "Mô tả sự kiện/công trình"
    }
]
"""

def process_image_safe(img_data):
    if isinstance(img_data, bytes):
        img = Image.open(BytesIO(img_data))
    else:
        img = img_data
    try: img.load()
    except: pass
    
    img_copy = img.copy()
    img_copy.thumbnail((1200, 1200)) 
    if img_copy.mode in ("RGBA", "P"): 
        img_copy = img_copy.convert("RGB")
        
    buffered = BytesIO()
    img_copy.save(buffered, format="JPEG", quality=95)
    clean_bytes = buffered.getvalue()
    b64_string = base64.b64encode(clean_bytes).decode("utf-8")
    return clean_bytes, b64_string

def call_gemini_vision(clean_bytes, prompt):
    try:
        safe_img = Image.open(BytesIO(clean_bytes))
        res = gemini_client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=[prompt, safe_img]
        )
        return clean_json(res.text)
    except Exception as e: return json.dumps([{"error": f"Gemini Lỗi: {str(e)}"}])

def call_groq_vision(b64_string, prompt):
    try:
        res = groq_client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
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
             return json.dumps([{"error": "Groq Vision không trả kết quả."}])
        return clean_json(res.choices[0].message.content)
    except Exception as e: return json.dumps([{"error": f"Groq Lỗi: {str(e)}"}])

def call_debate_agent(agent_role, original_json, peers_context):
    debate_prompt = f"""
    Bạn đang đóng vai: {agent_role} trong hội đồng giám định tiền tệ.
    Mảng kết quả ban đầu của bạn (JSON): {original_json}
    Mảng kết quả của đồng nghiệp: {peers_context}
    
    LUẬT GIÁM ĐỊNH:
    1. Kiểm tra chéo số lượng tờ tiền mà các bên tìm thấy. 
    2. BẮT BUỘC trả về kết quả cuối cùng dưới định dạng MẢNG JSON (JSON ARRAY).
    
    [
        {{ "quoc_gia": "...", "menh_gia": "...", "nam_phat_hanh": "...", "chat_lieu": "...", "mat_truoc": "...", "mat_sau": "..." }}
    ]
    CHỈ TRẢ VỀ JSON ARRAY. KHÔNG GIẢI THÍCH GÌ THÊM.
    """
    try:
        res = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": debate_prompt}],
            temperature=0.1
        )
        return clean_json(res.choices[0].message.content)
    except Exception as e: return json.dumps([{"error": "Lỗi Debate Agent"}])

def final_judge_groq(json_1, json_2, json_3):
    # ĐÃ SỬA CÂU THẦN CHÚ: ÉP AI KHÔNG ĐƯỢC BỊA THÊM "ĐỐI TƯỢNG 2" NẾU KHÔNG CÓ
    prompt_tong_hop = f"""
    Bạn là Thẩm định viên Trưởng Quốc Tế. Dưới đây là 3 mảng JSON ĐÃ QUA TRANH BIỆN:
    - Mỹ thuật: {json_1}
    - Ngôn ngữ: {json_2}
    - Lịch sử: {json_3}

    NHIỆM VỤ: Tổng hợp thành Báo Cáo Chính Thức. Bóc tách rõ từng tờ tiền.
    LƯU Ý CỰC KỲ QUAN TRỌNG: Trong các mảng JSON trên có bao nhiêu tờ tiền thì in ra bấy nhiêu "Đối tượng". TUYỆT ĐỐI KHÔNG tự bịa thêm "Đối tượng 2" nếu chỉ có 1 tờ tiền.

    ĐỊNH DẠNG MARKDOWN YÊU CẦU:
    ### KẾT LUẬN GIÁM ĐỊNH
    [Tóm tắt về các quốc gia và mệnh giá phát hiện được trong ảnh]

    #### 💵 Đối tượng 1:
    * **Quốc gia**: ...
    * **Mệnh giá**: ...
    * **Năm phát hành**: ...
    * **Chất liệu**: ...
    * **Mặt trước**: ...
    * **Mặt sau**: ...

    [CHỈ lặp lại khối Đối tượng tiếp theo NẾU thực sự có tờ tiền thứ 2, thứ 3...]

    ---
    *Ghi chú của Thẩm định viên:* [Nhận xét về mức độ rõ nét của ảnh và mức độ đồng thuận của AI]
    """
    try:
        res = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt_tong_hop}],
            temperature=0.1
        )
        return res.choices[0].message.content
    except Exception as e: return f"Lỗi tổng hợp: {str(e)}"

def run_consensus_system(image):
    clean_bytes, b64_string = process_image_safe(image)
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        f_gemini = executor.submit(call_gemini_vision, clean_bytes, PROMPT_GEMINI_ART)
        f_qwen = executor.submit(call_groq_vision, b64_string, PROMPT_QWEN_TEXT)
        f_llama = executor.submit(call_groq_vision, b64_string, PROMPT_LLAMA_LOGIC)
        
        try: kq_gemini_init = f_gemini.result(timeout=30)
        except: kq_gemini_init = '[{"error": "Gemini Timeout"}]'
            
        try: kq_qwen_init = f_qwen.result(timeout=30)
        except: kq_qwen_init = '[{"error": "Groq Qwen Timeout"}]'
            
        try: kq_llama_init = f_llama.result(timeout=30)
        except: kq_llama_init = '[{"error": "Groq Llama Timeout"}]'

    if "error" in kq_gemini_init and "error" in kq_qwen_init and "error" in kq_llama_init:
        raise Exception(f"Lỗi API: G({kq_gemini_init}) | Q({kq_qwen_init}) | L({kq_llama_init})")

    context_for_debate = f"- Mỹ thuật: {kq_gemini_init}\n- Ngôn ngữ: {kq_qwen_init}\n- Lịch sử: {kq_llama_init}"
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        f_debate_gemini = executor.submit(call_debate_agent, "Mỹ thuật", kq_gemini_init, context_for_debate)
        f_debate_qwen = executor.submit(call_debate_agent, "Ngôn ngữ", kq_qwen_init, context_for_debate)
        f_debate_llama = executor.submit(call_debate_agent, "Lịch sử", kq_llama_init, context_for_debate)
        
        try: kq_gemini_final = f_debate_gemini.result(timeout=30)
        except: kq_gemini_final = '[{"error": "Debate Gemini Timeout"}]'
            
        try: kq_qwen_final = f_debate_qwen.result(timeout=30)
        except: kq_qwen_final = '[{"error": "Debate Qwen Timeout"}]'
            
        try: kq_llama_final = f_debate_llama.result(timeout=30)
        except: kq_llama_final = '[{"error": "Debate Llama Timeout"}]'

    bao_cao_cuoi = final_judge_groq(kq_gemini_final, kq_qwen_final, kq_llama_final)
    
    return {
        "gemini": kq_gemini_final,
        "openrouter": kq_qwen_final, 
        "groq": kq_llama_final,        
        "final_report": bao_cao_cuoi
    }