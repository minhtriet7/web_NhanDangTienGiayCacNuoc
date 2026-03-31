import cv2
import numpy as np

def detect_and_crop_banknotes(image_bytes):
    """
    Hàm nhận diện và cắt từng tờ tiền từ một bức ảnh lớn (Đã nâng cấp)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    total_area = img.shape[0] * img.shape[1]
    
    # 1. Tiền xử lý ảnh
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Tăng độ mờ (Blur) lên một chút để khử nhiễu vân gỗ/bề mặt
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)
    
    # 2. Tìm viền bằng Adaptive Thresholding thay vì Otsu (Tốt hơn cho ảnh có bóng râm/nền phức tạp)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    edges = cv2.Canny(thresh, 30, 150)
    
    # 3. Kỹ thuật Dilation + Closing: Giúp nối liền các đường viền bị đứt đoạn do nhiễu
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    closed_edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    
    # 4. Tìm các đường viền
    contours, _ = cv2.findContours(closed_edges.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    cropped_images = []
    
    # Lấy tối đa 5 vật thể lớn nhất
    for c in contours[:5]:
        area = cv2.contourArea(c)
        
        # Hạ mức diện tích xuống 2% để bắt được các tờ tiền chụp từ xa
        if area > (total_area * 0.02): 
            # Tìm hình chữ nhật bao quanh viền (có tính đến góc xoay của tờ tiền)
            rect = cv2.minAreaRect(c)
            box = cv2.boxPoints(rect)
            box = np.int32(box)
            
            w, h = rect[1]
            if w == 0 or h == 0: continue
            
            # Nới lỏng tỷ lệ khung hình (1.1 đến 3.5)
            aspect_ratio = float(w)/h if w > h else float(h)/w
            
            if 1.1 <= aspect_ratio <= 3.5:
                # Cắt ảnh thẳng đứng (Bounding Rect cơ bản)
                x, y, w_b, h_b = cv2.boundingRect(c)
                
                # Thêm một chút padding (mở rộng lề) để không cắt phạm vào tiền
                pad = 10
                x1, y1 = max(0, x - pad), max(0, y - pad)
                x2, y2 = min(img.shape[1], x + w_b + pad), min(img.shape[0], y + h_b + pad)
                
                roi = img[y1:y2, x1:x2]
                _, buffer = cv2.imencode('.jpg', roi)
                cropped_images.append(buffer.tobytes())
            
    # Nếu hệ thống vẫn thất bại, trả về ảnh gốc để AI cố gắng đọc
    if len(cropped_images) == 0:
        print("Cảnh báo: OpenCV không tìm thấy tờ tiền nào rõ ràng, gửi toàn bộ ảnh gốc cho AI.")
        return [image_bytes]
        
    return cropped_images