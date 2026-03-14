from flask import Flask, request, jsonify
from docx import Document
import io

app = Flask(__name__)

@app.route('/api/parse', methods=['POST'])
def parse_file():
    try:
        # 1. Kiểm tra file được gửi lên từ Web
        if 'file' not in request.files:
            return jsonify({"error": "Không tìm thấy file đính kèm."}), 400

        file = request.files['file']
        
        # 2. Dùng python-docx mổ xẻ tận lõi XML của file Word
        doc = Document(io.BytesIO(file.read()))
        
        clean_text = ""
        
        # 3. Quét từng dòng (paragraph) trong Word
        for para in doc.paragraphs:
            line_text = ""
            
            # Quét từng cụm chữ (run) để bắt định dạng
            for run in para.runs:
                text = run.text
                if not text:
                    continue
                    
                # BÍ MẬT AZOTA: Nhận diện chính xác định dạng của từng chữ
                is_bold = run.bold
                is_underline = run.underline
                is_italic = run.italic
                
                # Bọc thẻ tàng hình chuẩn để Frontend V12 (index.html) hiểu được
                if is_bold:
                    text = f"[[B]]{text}[[/B]]"
                if is_underline:
                    text = f"[[U]]{text}[[/U]]"
                if is_italic:
                    text = f"[[I]]{text}[[/I]]"
                    
                line_text += text
                
            # 4. Gộp dòng và tối ưu hóa các thẻ bị đứt gãy
            if line_text.strip():
                # Fix lỗi Word hay tách các chữ bôi đậm ra làm nhiều mảnh 
                # (VD: [[B]]A[[/B]][[B]].[[/B]] -> nối lại thành [[B]]A.[[/B]])
                line_text = line_text.replace('[[/B]][[B]]', '')
                line_text = line_text.replace('[[/U]][[U]]', '')
                line_text = line_text.replace('[[/I]][[I]]', '')
                
                clean_text += line_text.strip() + "\n"

        # 5. Gửi toàn bộ chữ đã được "gắn chip" về lại cho trình duyệt bóc tách
        return jsonify({"success": True, "data": clean_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Hàm khởi tạo bắt buộc để chạy trên Vercel Serverless
def handler(request, response):
    return app(request, response)
