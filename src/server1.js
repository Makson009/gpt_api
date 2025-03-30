require('dotenv').config();
const express = require('express');
const OpenAI = require('openai'); // Новый импорт OpenAI SDK
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer'); // Для загрузки файлов
const Tesseract = require('tesseract.js'); // OCR-библиотека
const prompt_dictionary = require('../config'); // Подключаем словарь
console.log("импорт",prompt_dictionary);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Используйте переменные окружения
});

let skipApiRequest = true; // Флаг true - выкл. запросы gpt api

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'), { maxAge: 0 }));


// Настройка загрузки файлов
const upload = multer({ dest: 'uploads/' });

// Функция распознавания текста с изображения
async function recognizeTextFromImage(imagePath) {
    try {
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'rus+eng', 
            { logger: m => console.log(m) } 
        );
        return text;
    } catch (error) {
        console.error("Ошибка OCR:", error);
        return "Ошибка при распознавании текста.";
    }
}

// Обработчик загрузки изображения и OCR
app.post('/recognize', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Файл не загружен." });
    }

    console.log("Загружен файл:", req.file.path);

    const text = await recognizeTextFromImage(req.file.path);
    
    res.json({ recognizedText: text });
});


// Функция для перевода значений с помощью словаря
function translate(value) {
    console.log("ПЕРЕВОДЫ", value, prompt_dictionary[value])
    return prompt_dictionary[value] || value; // Если значение не найдено, возвращаем его как есть
}

// Функция для составления запроса к GPT
function createSentenceFromData(data) {
    const parts = [];

    // Переводим значения с помощью словаря
    if (data.section1?.button) {
        const translatedButton = translate(data.section1.button); // Переводим
        parts.push(`Составь документ "${translatedButton}".`);
    }

    if (data.section2?.button) {
        const translatedSender = translate(data.section2.button); // Переводим
        parts.push(`Отправитель: ${translatedSender}.`);
        if (data.section2.fields) {
            for (const [key, value] of Object.entries(data.section2.fields)) {
                parts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}.`);
            }
        }
    }

    if (data.section3?.button) {
        const translatedReceiver = translate(data.section3.button); // Переводим
        parts.push(`Получатель: ${translatedReceiver}.`);
        if (data.section3.fields) {
            for (const [key, value] of Object.entries(data.section3.fields)) {
                parts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}.`);
            }
        }
    }

    if (data.section4) {
        parts.push(`Описание ситуации: ${data.section4}`);
    }

    return parts.join(' ');
}

// Обработчик POST-запроса
app.post('/submit', async (req, res) => {
    try {
        const receivedData = req.body;
        console.log("Полученные данные:", receivedData);

        const sentence = createSentenceFromData(receivedData);
        console.log("Составленное предложение:", sentence);
        console.log("промпт", prompt_dictionary["system_prompt"]);

        let gptAnswer = '';

        if (!skipApiRequest) {
            const gptResponse = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: prompt_dictionary["system_prompt"]},
                    { role: "user", content: sentence }
                ],
            });
            console.log("отдал");
            gptAnswer = gptResponse.choices[0].message.content;
        } else {
            gptAnswer = "Этот запрос был пропущен, но вы все равно получите этот ответ как подмену.";
            console.log("Запрос к API пропущен. Используется mock-ответ.");
        }

        console.log("gpt", gptAnswer);

        res.json({
            message: "Данные обработаны успешно",
            result: gptAnswer,
        });
    } catch (error) {
        console.error("Ошибка обработки запроса:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.post('/toggle-api-request', (req, res) => {
    const { enable } = req.body;
    if (typeof enable === 'boolean') {
        skipApiRequest = enable;
        res.json({ message: `API запросы теперь ${enable ? 'пропущены' : 'включены'}` });
    } else {
        res.status(400).json({ error: 'Некорректное значение для enable' });
    }
});




// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
