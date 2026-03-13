export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { textHtml } = req.body;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

        if (!GEMINI_API_KEY) throw new Error("Chưa có API Key!");

        const prompt = `Bạn là chuyên gia bóc tách đề thi. Đọc mã HTML sau và trả về duy nhất một mảng JSON. 
        Mỗi phần tử có: "type" (mcq/section), "text", "options" (mảng 4 đáp án với "label", "text", "isCorrect").
        Phân tích kỹ thẻ <b> hoặc <u> để tìm đáp án đúng.
        NỘI DUNG HTML: ${textHtml}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        // Kiểm tra xem AI có trả về kết quả không
        if (!data.candidates || !data.candidates[0].content) {
            console.error("Gemini Error:", data);
            throw new Error("AI không trả về kết quả. Có thể do nội dung bị chặn hoặc API quá tải.");
        }

        let aiText = data.candidates[0].content.parts[0].text;
        
        // BỘ LỌC SIÊU SẠCH: Loại bỏ mọi ký tự lạ trước và sau JSON
        const jsonMatch = aiText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("AI không trả về đúng định dạng JSON.");
        
        const cleanJson = jsonMatch[0];
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ error: "Lỗi xử lý AI: " + error.message });
    }
}
