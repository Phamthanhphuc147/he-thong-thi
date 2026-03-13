export const maxDuration = 60; // Giữ nguyên 60 giây cho file nặng

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, content, mimeType } = req.body;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

        if (!GEMINI_API_KEY) throw new Error("Chưa cấu hình API Key!");

        // ÉP AI trả về JSON siêu sạch, không được tự ý Enter xuống dòng
        const prompt = `Bạn là hệ thống bóc tách đề thi siêu việt.
        Nhiệm vụ: Trích xuất và trả về ĐÚNG MỘT MẢNG JSON.
        
        QUY TẮC SỐNG CÒN (KHÔNG ĐƯỢC VI PHẠM):
        1. TRẢ VỀ JSON TRÊN 1 DÒNG DUY NHẤT (MINIFIED JSON). Tuyệt đối không dùng dấu xuống dòng (Enter) để format code.
        2. Nếu nội dung câu hỏi có xuống dòng, bắt buộc phải dùng ký tự '\\n', không gõ phím Enter thật.
        3. Tìm đáp án đúng dựa vào: In đậm, Gạch chân, Màu sắc, Khoanh tròn.

        Cấu trúc bắt buộc: [{"type": "mcq", "text": "Câu 1...", "options": [{"label": "A", "text": "...", "isCorrect": true}]}]`;

        let parts = [];
        if (type === 'html') {
            parts = [{ text: prompt + "\n\nNỘI DUNG:\n" + content }];
        } else if (type === 'media') {
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
        
        // Tìm mảng JSON
        const match = aiText.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("AI không trả về mảng JSON.");

        let rawJson = match[0];
        
        // BỘ LỌC SIÊU MẠNH: Quét sạch mọi ký tự điều khiển (Control characters), dấu Tab, Enter ẩn gây nổ JSON
        rawJson = rawJson.replace(/[\u0000-\u001F]+/g, " ");

        res.status(200).json(JSON.parse(rawJson));

    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ error: error.message });
    }
}
