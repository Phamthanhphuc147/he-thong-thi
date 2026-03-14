from flask import Flask, request, jsonify
from docx import Document
import io

app = Flask(__name__)

@app.route('/api/parse', methods=['POST'])
def parse_file():
    try:
        # Kiểm tra file gửi lên
        if 'file' not in request.files:
            return jsonify({"error": "Không tìm thấy file đính kèm."}), 400

        file = request.files['file']
        
        # Mổ xẻ lõi file Word bằng python-docx
        doc = Document(io.BytesIO(file.read()))
        
        clean_text = ""
        
        # Quét từng đoạn văn bản
        for para in doc.paragraphs:
            line_text = ""
            # Quét từng chữ trong đoạn văn
            for run in para.runs:
                text = run.text
                if not text.strip():
                    line_text += text
                    continue
                    
                # BÍ MẬT AZOTA: Bắt cực chuẩn chữ in đậm từ lõi XML
                if run.bold:
                    line_text += f" [[B]]{text}[[/B]] "
                else:
                    line_text += text
                    
            if line_text.strip():
                clean_text += line_text.strip() + "\n"

        return jsonify({"success": True, "data": clean_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Khởi tạo cho Vercel Serverless
def handler(request, response):
    return app(request, response)
