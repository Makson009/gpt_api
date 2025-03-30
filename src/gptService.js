const OpenAI = require('openai');
const { updateUserFlag, saveRequestData, checkUserFlag } = require('./db');
const jwt = require('jsonwebtoken');
const { getUserFromToken } = require('./utils');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

module.exports = { processGptRequest };
