// Ép Vercel bản Free tăng thời gian chờ lên tối đa 60 giây (Chống sập server khi file nặng)
export const maxDuration = 60; 

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, content, mimeType } = req.body;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

        if (!GEMINI_API_KEY) throw new Error("Chưa cấu hình API Key trên máy chủ Vercel!");

        const prompt = `Bạn là hệ thống bóc tách đề thi trắc nghiệm siêu việt.
        Nhiệm vụ: Trích xuất nội dung từ dữ liệu cung cấp và trả về ĐÚNG MỘT MẢNG JSON.
        
        QUY TẮC TÌM ĐÁP ÁN ĐÚNG (isCorrect: true):
        - Nếu là Văn bản/HTML: Chữ được In đậm (<b>, <strong>), Gạch chân (<u>), hoặc có MÀU SẮC khác biệt.
        - Nếu là Ảnh/PDF: Đáp án được khoanh tròn, đánh dấu tick, tô đậm, hoặc gạch dưới.

        Cấu trúc mảng JSON bắt buộc (Không chứa Markdown \`\`\`json):
        [{"type": "mcq", "text": "Câu 1: Nội dung câu hỏi...", "options": [{"label": "A", "text": "Nội dung đáp án", "isCorrect": true/false}]}]
        
        Chỉ trả về JSON thuần túy, tuyệt đối không giải thích thêm.`;

        let parts = [];
        
        // Nhận HTML từ file Word
        if (type === 'html') {
            parts = [{ text: prompt + "\n\nNỘI DUNG HTML:\n" + content }];
        } 
        // Nhận file PDF hoặc Ảnh (Base64)
        else if (type === 'media') {
            parts = [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: content } }
            ];
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: parts }] })
        });

        const data = await response.json();
        
        if (data.error) throw new Error("Google AI Error: " + data.error.message);
        if (!data.candidates || !data.candidates[0].content) throw new Error("AI không trả về dữ liệu.");

        let aiText = data.candidates[0].content.parts[0].text;
        
        const match = aiText.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("AI không trả về đúng định dạng mảng JSON.");

        res.status(200).json(JSON.parse(match[0]));

    } catch (error) {
        console.error("Lỗi xử lý:", error);
        res.status(500).json({ error: error.message });
    }
}
