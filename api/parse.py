from flask import Flask, request, jsonify
from docx import Document
from docx.enum.text import WD_COLOR_INDEX
import io

app = Flask(__name__)

@app.route('/api/parse', methods=['POST'])
def parse_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "Không tìm thấy file đính kèm."}), 400

        file = request.files['file']
        doc = Document(io.BytesIO(file.read()))
        clean_text = ""
        
        for para in doc.paragraphs:
            line_text = ""
            for run in para.runs:
                text = run.text
                if not text: continue
                    
                # 1. Bắt In Đậm, Gạch Chân
                is_bold = run.bold
                is_underline = run.underline
                
                # 2. Bắt Tô Màu Nền (Highlight) và Màu Chữ (Đỏ, Xanh...)
                is_highlight = False
                if run.font.highlight_color and run.font.highlight_color != WD_COLOR_INDEX.AUTO:
                    is_highlight = True
                if run.font.color and run.font.color.rgb:
                    if str(run.font.color.rgb) != "000000": # Nếu chữ có màu khác đen
                        is_highlight = True
                
                # 3. Đóng gói thành thẻ nội bộ cho Web đọc
                if is_highlight: text = f"[[HL]]{text}[[/HL]]"
                if is_underline: text = f"[[U]]{text}[[/U]]"
                if is_bold: text = f"[[B]]{text}[[/B]]"
                    
                line_text += text
                
            if line_text.strip():
                # Dọn dẹp các thẻ nối tiếp nhau do Word tự ngắt
                line_text = line_text.replace('[[/B]][[B]]', '').replace('[[/U]][[U]]', '').replace('[[/HL]][[HL]]', '')
                clean_text += line_text.strip() + "\n"

        return jsonify({"success": True, "data": clean_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def handler(request, response):
    return app(request, response)
