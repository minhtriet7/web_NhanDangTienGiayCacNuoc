import os
import json
import time
import random
import concurrent.futures
from io import BytesIO
from dotenv import load_dotenv
from google import genai 
from PIL import Image, ImageFile 

ImageFile.LOAD_TRUNCATED_IMAGES = True 
load_dotenv()

gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# 🚀 NÂNG CẤP TỐI THƯỢNG: Hàm bóc tách JSON "bất tử"
def clean_json(text):
    if not text: 
        return '[{"error": "AI trả về dữ liệu rỗng"}]'
        
    text = text.strip()
    
    # 1. Thử parse ngay lập tức nếu AI trả về JSON chuẩn
    try:
        json.loads(text)
        return text
    except:
        pass

    # 2. Thuật toán "Móc ruột": Quét từ dấu '[' đầu tiên đến dấu ']' cuối cùng
    try:
        start_idx = text.find('[')
        end_idx = text.rfind(']') + 1
        
        if start_idx != -1 and end_idx != -1:
            extracted_json = text[start_idx:end_idx]
            # Test xem cái móc ra có chuẩn JSON không
            json.loads(extracted_json) 
            return extracted_json
    except:
        pass

    # 3. Kịch bản dự phòng: Bóc theo Markdown (```json)
    try:
        if '```json' in text:
            extracted = text.split('```json', 1)[1].split('```', 1)[0].strip()
            json.loads(extracted)
            return extracted
        elif '```' in text:
            extracted = text.split('```', 1)[1].split('```', 1)[0].strip()
            json.loads(extracted)
            return extracted
    except:
        pass
        
    # Nếu tạch cả 3 kịch bản, in log ra để Giám đốc kiểm tra
    print(f"❌ Lỗi Parse JSON bất trị:\n--- Data thô ---\n{text}\n----------------")
    return json.dumps([{"error": "AI bị ảo giác, trả về sai định dạng JSON."}])


# 1. Chuyên gia Tổng quan
MODEL_EXP1_MAIN = "gemini-2.5-flash"
MODEL_EXP1_BACKUP = "gemini-2.5-flash-lite"

# 2. Chuyên gia Chi tiết
MODEL_EXP2_MAIN = "gemini-2.5-flash-lite"
MODEL_EXP2_BACKUP = "gemini-2.5-flash"
#gemini-2.5-flash-lite
# 3. Chuyên gia Phản biện
MODEL_EXP3_MAIN = "gemini-3.1-flash-lite-preview"
MODEL_EXP3_BACKUP = "gemini-2.5-flash-lite"

# 4. Trọng tài
MODEL_JUDGE_MAIN = "gemini-2.5-flash-lite" 
MODEL_JUDGE_BACKUP = "gemini-3.0-flash-preview"

# ==========================================
# HỆ THỐNG PROMPT 
# ==========================================
RULE_BASE = """
QUY TẮC SỐ 1: Đây là hệ thống giám định TIỀN GIẤY. Nếu hình ảnh bị gập, rách, hoặc mờ, hãy DỰA VÀO CÁC CHỮ VIẾT, CHÂN DUNG CÒN LẠI để phân tích.
QUY TẮC SỐ 2: TUYỆT ĐỐI KHÔNG ĐOÁN MÒ các quốc gia xa lạ nếu không có bằng chứng chữ viết rõ ràng. Nếu không chắc chắn, hãy ưu tiên các loại tiền tệ phổ biến (Việt Nam, Mỹ, Châu Âu).
QUY TẮC SỐ 3: Nếu không thấy Năm phát hành, BẮT BUỘC SUY LUẬN ra thập niên/năm chính xác nhất.
"""

PROMPT_EXP1_OVERVIEW = RULE_BASE + """
Bạn là Chuyên gia Tổng quan. Quét nhanh phong cách, màu sắc, mệnh giá.
BẮT BUỘC TRẢ VỀ MẢNG JSON (ARRAY):
[{"quoc_gia": "Tên quốc gia", "menh_gia": "Số mệnh giá + Mã ISO", "nam_phat_hanh": "Năm in (hoặc tự suy luận)", "chat_lieu": "Giấy / Polymer / Kim loại", "mat_truoc": "Mô tả màu sắc, bố cục, hình ảnh", "mat_sau": "Mô tả màu sắc, bố cục, hình ảnh"}]
"""

PROMPT_EXP2_DETAILS = RULE_BASE + """
Bạn là Chuyên gia Chi tiết. Soi kỹ chữ in siêu nhỏ, hình bóng chìm.
BẮT BUỘC TRẢ VỀ MẢNG JSON (ARRAY):
[{"quoc_gia": "Dựa vào chữ viết", "menh_gia": "Số tiền + Mã ISO", "nam_phat_hanh": "Năm in (hoặc tự suy luận)", "chat_lieu": "Phân tích chất liệu", "mat_truoc": "Liệt kê chi tiết hoa văn, chữ ký", "mat_sau": "Liệt kê chi tiết hoa văn, con số ẩn"}]
"""

PROMPT_EXP3_CRITIC = RULE_BASE + """
Bạn là Chuyên gia Phản biện. Tìm kiếm dấu hiệu bất thường, vết xước để xác minh.
BẮT BUỘC TRẢ VỀ MẢNG JSON (ARRAY):
[{"quoc_gia": "Xác nhận quốc gia", "menh_gia": "Xác nhận mệnh giá", "nam_phat_hanh": "Năm in (hoặc tự suy luận)", "chat_lieu": "Chất liệu", "mat_truoc": "Đánh giá tình trạng cũ/mới, nếp gấp, vết mờ", "mat_sau": "Đánh giá tình trạng cũ/mới, nếp gấp, vết mờ"}]
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
    return buffered.getvalue()

def call_gemini_vision(clean_bytes, prompt, model_name):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            safe_img = Image.open(BytesIO(clean_bytes))
            res = gemini_client.models.generate_content(
                model=model_name, contents=[prompt, safe_img]
            )
            return clean_json(res.text)
        except Exception as e:
            print(f"⚠️ Vision ({model_name} Lần {attempt+1}): {str(e)}")
            if attempt < max_retries - 1: time.sleep(random.uniform(3, 5))
            else: return json.dumps([{"error": f"Lỗi gọi {model_name}. Vui lòng thử lại!"}])

def call_debate_agent_gemini(agent_role, original_json, peers_context, model_name):
    if "Hình ảnh không hợp lệ" in original_json or "Hình ảnh không hợp lệ" in peers_context:
        return original_json

    debate_prompt = f"""
    Bạn đang đóng vai: {agent_role}.
    Kết quả phân tích độc lập ban đầu của bạn: {original_json}
    Kết quả phân tích của đồng nghiệp: {peers_context}
    
    NHIỆM VỤ TRANH BIỆN:
    1. So sánh Dữ liệu cốt lõi (Quốc gia, Mệnh giá, Năm). Chỉ sửa của bạn nếu bạn sai khác hoàn toàn so với đa số.
    2. BẮT BUỘC giữ vững góc nhìn chuyên môn của "{agent_role}". Trình bày lại kết quả theo form JSON quy định.
    BẮT BUỘC TRẢ VỀ CHỈ MỘT MẢNG JSON ARRAY.
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            res = gemini_client.models.generate_content(
                model=model_name, contents=[debate_prompt]
            )
            return clean_json(res.text)
        except Exception as e:
            print(f"⚠️ Debate ({agent_role} Lần {attempt+1}): {str(e)}")
            if attempt < max_retries - 1: time.sleep(random.uniform(3, 5))
            else: return json.dumps([{"error": f"Hệ thống quá tải. Quét lại sau ít phút."}])

def final_judge_gemini(json_1, json_2, json_3, model_name):
    if "Hình ảnh không hợp lệ" in json_1 or "Hình ảnh không hợp lệ" in json_2:
        return "❌ Hình ảnh không hợp lệ (Không phải tiền tệ)."

    prompt_tong_hop = f"""
    Thẩm định viên Trưởng. JSON ĐÃ TRANH BIỆN từ 3 chuyên gia:
    - Tổng quan: {json_1}
    - Chi tiết: {json_2}
    - Phản biện: {json_3}

    NHIỆM VỤ: 
    1. So sánh, chọn KẾT QUẢ ĐÚNG NHẤT VÀ DUY NHẤT.
    ĐỊNH DẠNG YÊU CẦU:
    ### 🏆 [MỆNH GIÁ] - [QUỐC GIA]
    * **Năm phát hành:** ...
    * **Chất liệu:** ...
    * **Đánh giá:** [1 CÂU DUY NHẤT tóm tắt cuộc tranh biện].
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            res = gemini_client.models.generate_content(
                model=model_name, contents=[prompt_tong_hop]
            )
            return res.text
        except Exception as e:
            if attempt < max_retries - 1: time.sleep(3)
            else: return f"Lỗi tổng hợp: {str(e)}"

def check_early_consensus(json1_str, json2_str, json3_str):
    """ THUẬT TOÁN EARLY EXIT: Ktra 3 AI có đồng thuận ngay từ Bước 1 không """
    try:
        j1, j2, j3 = json.loads(json1_str), json.loads(json2_str), json.loads(json3_str)
        # Kiểm tra xem có lấy được bản ghi đầu tiên của các mảng không
        if len(j1) > 0 and len(j2) > 0 and len(j3) > 0:
            if (j1[0].get("quoc_gia") == j2[0].get("quoc_gia") == j3[0].get("quoc_gia")) and \
               (j1[0].get("menh_gia") == j2[0].get("menh_gia") == j3[0].get("menh_gia")):
                return True
        return False
    except:
        return False

# ==========================================
# LUỒNG XỬ LÝ CHÍNH
# ==========================================
def run_consensus_system(image):
    try:
        clean_bytes = process_image_safe(image)
        
        # BƯỚC 1: SOI ĐỘC LẬP
        with concurrent.futures.ThreadPoolExecutor() as executor:
            f_exp1 = executor.submit(call_gemini_vision, clean_bytes, PROMPT_EXP1_OVERVIEW, MODEL_EXP1_MAIN)
            f_exp2 = executor.submit(call_gemini_vision, clean_bytes, PROMPT_EXP2_DETAILS, MODEL_EXP2_MAIN)
            f_exp3 = executor.submit(call_gemini_vision, clean_bytes, PROMPT_EXP3_CRITIC, MODEL_EXP3_MAIN)
            
            kq_exp1_init = f_exp1.result(timeout=45)
            kq_exp2_init = f_exp2.result(timeout=45)
            kq_exp3_init = f_exp3.result(timeout=45)

        # KÍCH HOẠT EARLY EXIT
        if check_early_consensus(kq_exp1_init, kq_exp2_init, kq_exp3_init):
            print("⚡ THUẬT TOÁN EARLY EXIT KÍCH HOẠT: Bỏ qua Tranh biện!")
            bao_cao_cuoi = final_judge_gemini(kq_exp1_init, kq_exp2_init, kq_exp3_init, MODEL_JUDGE_MAIN)
            return {
                "chuyen_gia_1": kq_exp1_init,        
                "chuyen_gia_2": kq_exp2_init,    
                "chuyen_gia_3": kq_exp3_init,          
                "final_report": bao_cao_cuoi
            }

        context_for_debate = f"- Tổng quan: {kq_exp1_init}\n- Chi tiết: {kq_exp2_init}\n- Phản biện: {kq_exp3_init}"
        time.sleep(2)
        
        # BƯỚC 2: TRANH BIỆN CHÉO
        with concurrent.futures.ThreadPoolExecutor() as executor:
            f_debate_1 = executor.submit(call_debate_agent_gemini, "Chuyên gia Tổng quan", kq_exp1_init, context_for_debate, MODEL_EXP1_BACKUP)
            f_debate_2 = executor.submit(call_debate_agent_gemini, "Chuyên gia Chi tiết", kq_exp2_init, context_for_debate, MODEL_EXP2_BACKUP)
            f_debate_3 = executor.submit(call_debate_agent_gemini, "Chuyên gia Phản biện", kq_exp3_init, context_for_debate, MODEL_EXP3_BACKUP)
            
            kq_exp1_final = f_debate_1.result(timeout=40)
            kq_exp2_final = f_debate_2.result(timeout=40)
            kq_exp3_final = f_debate_3.result(timeout=40)

        # BƯỚC 3: TRỌNG TÀI
        bao_cao_cuoi = final_judge_gemini(kq_exp1_final, kq_exp2_final, kq_exp3_final, MODEL_JUDGE_MAIN)
        
        return {
            "chuyen_gia_1": kq_exp1_final,        
            "chuyen_gia_2": kq_exp2_final,    
            "chuyen_gia_3": kq_exp3_final,          
            "final_report": bao_cao_cuoi
        }
    except Exception as e:
        print(f"❌ Lỗi luồng chính: {str(e)}")
        return {
            "chuyen_gia_1": '[{"error": "Tiến trình AI bị lỗi"}]',        
            "chuyen_gia_2": '[{"error": "Tiến trình AI bị lỗi"}]',    
            "chuyen_gia_3": '[{"error": "Tiến trình AI bị lỗi"}]',          
            "final_report": f"❌ Lỗi hệ thống: {str(e)}"
        }