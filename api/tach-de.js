// File: api/tach-de.js (MÁY CHỦ VERCEL)
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { textHtml } = req.body;
        // Lấy API Key từ biến môi trường của Vercel
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

        if (!GEMINI_API_KEY) throw new Error("Chưa cấu hình API Key trên Vercel!");

        const prompt = `Bạn là chuyên gia bóc tách đề thi. 
        Hãy đọc mã HTML của đề thi sau và trả về ĐÚNG MỘT MẢNG JSON.
        Cấu trúc JSON: [{"type": "mcq/section", "text": "...", "options": [{"label": "A", "text": "...", "isCorrect": true/false}]}]
        Chú ý: Dựa vào thẻ <b>, <u> để tìm đáp án đúng.
        NỘI DUNG HTML: ${textHtml}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        let aiText = data.candidates[0].content.parts[0].text;
        let cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

        res.status(200).json(JSON.parse(cleanJson));
    } catch (error) {
        res.status(500).json({ error: "Lỗi AI Backend: " + error.message });
    }
}
