const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const tesseract = require('tesseract.js');
require('dotenv').config();

// استيراد OpenAI API
const OpenAI = require('openai');

// إعداد Express
const app = express();
const upload = multer();

// إعداد OpenAI باستخدام الـ API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // تأكد من وجود الـ API key في ملف .env
});

// تنظيف النصوص
function cleanText(text) {
    return text.replace(/[^A-Za-z0-9\s.,%\-()\/]/g, '').replace(/\s+/g, ' ').trim();
}

// استخراج الفحوصات والنتائج من نص الـ PDF
function extractTestsAndResults(text) {
    const pattern = /([A-Za-z\s()]+)\s+(\d+\.?\d*)\s*(Low|High|Borderline|Normal)?\s+(\d+\.?\d*\s*-\s*\d+\.?\d*)/g;
    const matches = [...text.matchAll(pattern)];

    return matches.map(match => ({
        test: match[1].trim(),
        result: match[2],
        status: match[3] || 'Normal',
        reference_range: match[4]
    }));
}

// استخراج النص من PDF
async function extractTextFromPdf(fileBuffer) {
    const data = await pdfParse(fileBuffer);
    return cleanText(data.text);
}

// استخراج النص من الصور باستخدام Tesseract
async function extractTextFromImage(imageBuffer) {
    const { data: { text } } = await tesseract.recognize(imageBuffer, 'eng+ara', { logger: m => console.log(m) });
    return cleanText(text);
}

// إعداد الرسالة لتوليد النص المطلوب من GPT-4 مع عناوين محددة بناءً على اللغة
function generatePrompt(extractedResults, age, gender, language) {
    const currentResults = extractedResults.map(result => `${result.test}: ${result.result} (${result.status})`).join(', ');

    if (language === 'ar') {
        return `
        أنت طبيب متخصص في تفسير نتائج فحوصات الدم. سيتم تقديم نتائج الفحوصات، ويجب أن تقدم تفسيرًا دقيقًا وشاملًا. بعد كل تفسير، يجب أن تقدم التوصيات والمراقبة. وفي النهاية، قدم تشخيصًا عامًا للحالة.

        المريض: ${gender === 'male' ? 'ذكر' : 'أنثى'}, ${age} سنة
        نتائج الفحوصات: ${currentResults}

        الرجاء تقديم الأهمية السريرية لكل نتيجة ثم التوصيات اللازمة والمراقبة.
        
        يرجى استخدام العناوين التالية:
         الأهمية السريرية:
         التوصيات:
         المراقبة:
         التشخيص العام:
        `;
    } else {
        return `
        You are a doctor specializing in interpreting blood test results. You will be provided with test results, and you need to provide a precise and comprehensive interpretation. After each interpretation, you must provide recommendations and monitoring. Finally, provide a general diagnosis of the case.

        Patient: ${gender === 'male' ? 'Male' : 'Female'}, Age: ${age}
        Test results: ${currentResults}

        Please provide the clinical significance for each result, followed by recommendations and monitoring.

        Please use the following headings:
         Clinical Significance:
         Recommendations:
         Monitoring:
         General Diagnosis:
        `;
    }
}

// دالة لاستخراج كل قسم من النص المولد بناءً على العناوين
function extractSection(text, startLabel, endLabel) {
    const startIndex = text.indexOf(startLabel);
    if (startIndex === -1) {
        return "No data found.";
    }

    const endIndex = endLabel ? text.indexOf(endLabel, startIndex) : text.length;
    if (endIndex === -1) {
        return text.substring(startIndex + startLabel.length).trim();
    }

    return text.substring(startIndex + startLabel.length, endIndex).trim();
}

// صفحة البداية
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// معالجة رفع التقرير
app.post('/api/upload-report', upload.single('file'), async (req, res) => {
    try {
        const { language, gender, age } = req.body;
        const file = req.file;

        if (!file || !language || !gender || !age) {
            return res.status(400).json({ error: 'File, language, gender, and age are required.' });
        }

        let text = '';
        let extractedResults = [];

        // التعامل مع ملفات PDF، الصور، و docx
        if (file.mimetype === 'application/pdf') {
            text = await extractTextFromPdf(file.buffer);
            extractedResults = extractTestsAndResults(text);
        } else if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
            text = await extractTextFromImage(file.buffer);
        } else {
            return res.status(400).json({ error: 'Unsupported file type.' });
        }

        // إعداد الرسالة للـ GPT-4 مع العناوين المطلوبة بناءً على اللغة
        const prompt = generatePrompt(extractedResults, age, gender, language);

        // استدعاء OpenAI لإنشاء التفسير
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2500,
            temperature: 0.1, // تقليل العشوائية لزيادة الدقة
        });

        const generatedText = response.choices[0].message.content;

        // تقسيم النتائج: الأهمية السريرية، التوصيات، المراقبة، التشخيص العام
        const clinicalSignificance = extractSection(generatedText, language === 'ar' ? "الأهمية السريرية:" : "Clinical Significance:", language === 'ar' ? "التوصيات:" : "Recommendations:");
        const recommendations = extractSection(generatedText, language === 'ar' ? "التوصيات:" : "Recommendations:", language === 'ar' ? "المراقبة:" : "Monitoring:");
        const monitoring = extractSection(generatedText, language === 'ar' ? "المراقبة:" : "Monitoring:", language === 'ar' ? "التشخيص العام:" : "General Diagnosis:");
        const generalDiagnosis = extractSection(generatedText, language === 'ar' ? "التشخيص العام:" : "General Diagnosis:", "");

        // إعداد النتائج بناءً على اللغة المختارة
        const result = {
            clinicalSignificance: clinicalSignificance,
            recommendations: recommendations,
            monitoring: monitoring,
            generalDiagnosis: generalDiagnosis
        };

        // إذا كانت اللغة هي الإنجليزية، نعرض كل شيء بالإنجليزية
        if (language === 'en') {
            result.clinicalSignificance = "Clinical Significance:\n" + result.clinicalSignificance;
            result.recommendations = "Recommendations:\n" + result.recommendations;
            result.monitoring = "Monitoring:\n" + result.monitoring;
            result.generalDiagnosis = "General Diagnosis:\n" + result.generalDiagnosis;
        }

        // إرسال النتيجة كـ JSON
        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing the file.' });
    }
});

// تشغيل الخادم
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
