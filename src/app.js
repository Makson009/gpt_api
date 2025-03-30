require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const { updateUserFlag, saveRequestData, checkUserFlag } = require('./db');

const app = express();
app.use(express.json()); // Позволяет обрабатывать JSON в теле запроса

// Инициализация OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Обработка запроса к GPT
async function processGptRequest(userId, prompt) {
    try {
        // Проверяем флаг
        const canRequest = await checkUserFlag(userId);
        if (!canRequest) {
            return { error: "Вы уже использовали свою попытку." };
        }

        // Меняем флаг на false (запрещаем повторный запрос)
        await updateUserFlag(userId, false);

        // Отправляем запрос в GPT
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
        });

        const responseText = gptResponse.choices[0].message.content;

        // Сохраняем запрос и ответ
        await saveRequestData(userId, prompt, responseText);

        return { response: responseText };
    } catch (error) {
        console.error('Ошибка в процессе запроса GPT:', error);
        return { error: 'Ошибка при обработке запроса.' };
    }
}

// REST API для обработки запросов с фронтенда
app.post('/submit', async (req, res) => {
    const { userId, prompt } = req.body;
    if (!userId || !prompt) {
        return res.status(400).json({ error: "Отсутствует userId или prompt" });
    }

    const result = await processGptRequest(userId, prompt);
    res.json(result);
});

module.exports = app; // Теперь экспортируется только Express-приложение
