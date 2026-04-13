import cv2
import numpy as np

def detect_and_crop_banknotes(image_bytes):
    """
    Hàm nhận diện và cắt từng tờ tiền (Bản tối ưu chống cắt nhầm rác/logo).
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    total_area = img.shape[0] * img.shape[1]
    
    # 1. Tiền xử lý đơn giản và hiệu quả
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Kết hợp Canny với ngưỡng tự động
    edges = cv2.Canny(blurred, 40, 150)
    
    # Nối các đường viền bị đứt
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    closed_edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    cropped_images = []
    
    for c in contours[:3]: # Chỉ lấy tối đa 3 vật thể to nhất
        area = cv2.contourArea(c)
        
        # BẮT BUỘC DIỆN TÍCH PHẢI LỚN HƠN 10% ẢNH GỐC
        if area > (total_area * 0.10): 
            x, y, w, h = cv2.boundingRect(c)
            aspect_ratio = float(w)/h if w > h else float(h)/w
            
            if 0.5 <= aspect_ratio <= 4.0:
                pad = 10
                x1, y1 = max(0, x - pad), max(0, y - pad)
                x2, y2 = min(img.shape[1], x + w + pad), min(img.shape[0], y + h + pad)
                
                roi = img[y1:y2, x1:x2]
                _, buffer = cv2.imencode('.jpg', roi)
                cropped_images.append(buffer.tobytes())
                
    # FALLBACK: Nếu cắt hỏng, BẮT BUỘC trả về ảnh gốc để AI tự nhìn toàn cảnh
    if len(cropped_images) == 0:
        print("⚠️ OpenCV không tìm thấy khung tiền, gửi toàn bộ ảnh gốc cho AI!")
        return [image_bytes]
        
    return cropped_images