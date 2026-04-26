import cv2
import numpy as np

def detect_and_crop_banknotes(image_bytes):
    """
    Hàm nhận diện và cắt (TẬP TRUNG 100% VÀO TIỀN GIẤY - BỎ QUA RÁC/XU).
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    total_area = img.shape[0] * img.shape[1]
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    edges = cv2.Canny(blurred, 40, 150)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    closed_edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    cropped_images = []
    
    # KỶ LUẬT THÉP: Chỉ lấy tối đa 3 tờ tiền to nhất
    for c in contours[:3]: 
        area = cv2.contourArea(c)
        
        # BẮT BUỘC: Phải chiếm hơn 12% diện tích ảnh (Lọc bỏ ngay xu, rác, bóng mờ)
        if area > (total_area * 0.12): 
            x, y, w, h = cv2.boundingRect(c)
            aspect_ratio = float(w)/h if w > h else float(h)/w
            
            # ÉP KHUNG HÌNH CHỮ NHẬT: Tiền giấy thường có tỷ lệ dài/rộng từ 1.2 đến 3.5
            if 1.0 <= aspect_ratio <= 3.5:
                pad = 15
                x1, y1 = max(0, x - pad), max(0, y - pad)
                x2, y2 = min(img.shape[1], x + w + pad), min(img.shape[0], y + h + pad)
                
                roi = img[y1:y2, x1:x2]
                _, buffer = cv2.imencode('.jpg', roi)
                cropped_images.append(buffer.tobytes())
                
    # FALLBACK THẦN THÁNH: Nếu tờ tiền bị gập nát (OpenCV không nhận ra hình chữ nhật),
    # Gửi nguyên cả tấm ảnh gốc cho Gemini. Gemini nhìn tổng thể cực kỳ thông minh!
    if len(cropped_images) == 0:
        print("⚠️ Ảnh bị gập/nhiễu, gửi TOÀN BỘ ảnh gốc cho AI để đảm bảo chính xác!")
        return [image_bytes]
        
    return cropped_images