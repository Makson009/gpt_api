require('dotenv').config();  // Подключаем dotenv для работы с переменными окружения
const express = require('express');
const OpenAI = require('openai');
const path = require('path');
const prompt_dictionary = require('../config');
const app = express();

let skipApiRequest = true;


app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'), { maxAge: 0 }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔁 Перевод с помощью словаря
function translate(value) {
    return prompt_dictionary[value] || value;
}

// 🧠 Создание запроса к GPT
function createSentenceFromData(data) {
    const parts = [];

    if (data.section1?.button) {
        parts.push(`Составь документ "${translate(data.section1.button)}".`);
    }

    if (data.section2?.button) {
        parts.push(`Отправитель: ${translate(data.section2.button)}.`);
        for (const [key, value] of Object.entries(data.section2.fields || {})) {
            parts.push(`${capitalize(key)}: ${value}.`);
        }
    }

    if (data.section3?.button) {
        parts.push(`Получатель: ${translate(data.section3.button)}.`);
        for (const [key, value] of Object.entries(data.section3.fields || {})) {
            parts.push(`${capitalize(key)}: ${value}.`);
        }
    }

    if (data.section4) {
        parts.push(`Описание ситуации: ${data.section4}`);
    }

    return parts.join(' ');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// 🚀 Обработчик /submit
app.post('/submit', async (req, res) => {
    try {
        const receivedData = req.body;
        const sentence = createSentenceFromData(receivedData);

        let gptAnswer = '';

        if (!skipApiRequest) {
            // Уменьшаем количество оставшихся попыток
            const remaining = await decrementRemainingRequests(receivedData.userId);

            const gptResponse = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: prompt_dictionary["system_prompt"] },
                    { role: "user", content: sentence }
                ],
            });
            gptAnswer = gptResponse.choices[0].message.content;

            res.json({ message: "Данные обработаны успешно", result: gptAnswer, remaining });
        } else {
            gptAnswer = "Этот запрос был пропущен, но вы все равно получите этот ответ как подмену.";
            res.json({ message: "Данные обработаны успешно", result: gptAnswer, remaining: 3 });
        }
    } catch (error) {
        console.error("Ошибка обработки запроса:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


// 🔁 Тумблер для включения/выключения запроса к API
app.post('/toggle-api-request', (req, res) => {
    // Просто проверяем текущий флаг skipApiRequest
    if (skipApiRequest) {
        res.json({ message: 'API запросы сейчас пропущены (заглушка включена)' });
    } else {
        res.json({ message: 'API запросы включены' });
    }
});


// Добавляем новый маршрут для получения оставшихся попыток
app.post('/api/remaining-requests', async (req, res) => {
    const { userId } = req.body;  // Получаем имя пользователя из запроса
    if (!userId) {
        return res.status(400).json({ error: "userId обязателен" });
    }

    try {
        // Функция для получения оставшихся попыток из БД или другой системы
        const remaining = await getRemainingRequests(userId);

        // Возвращаем оставшиеся попытки в ответ
        res.json({ remaining });
    } catch (error) {
        console.error("Ошибка при получении лимита:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Функция для получения оставшихся попыток из базы данных
async function getRemainingRequests(userId) {
    try {
        const result = await client.query('SELECT remainingRequests FROM users WHERE userId = $1', [userId]);
        
        if (result.rows.length > 0) {
            return result.rows[0].remainingrequests;
        } else {
            skipApiRequest = true;// Устанавливаем флаг заглушки на true
            
        }
    } catch (error) {
        console.error("Ошибка при запросе к базе данных:", error);
        throw new Error("Ошибка базы данных");
    }
}

// Функция для уменьшения оставшихся попыток
async function decrementRemainingRequests(userId) {
    try {
        // Сначала проверим, есть ли пользователь
        const userCheck = await client.query('SELECT remainingRequests FROM users WHERE userId = $1', [userId]);
        
        if (userCheck.rows.length === 0) {
            // Если пользователя нет, добавляем с 3 попытками
            await client.query('INSERT INTO users (userId, remainingRequests) VALUES ($1, 3)', [userId]);
            return 3;  // Возвращаем начальное значение
        }
        
        // Если пользователь есть, уменьшаем количество попыток
        const result = await client.query('UPDATE users SET remainingRequests = remainingRequests - 1 WHERE userId = $1 RETURNING remainingRequests', [userId]);
        return result.rows[0].remainingrequests;
    } catch (error) {
        console.error("Ошибка при обновлении базы данных:", error);
        throw new Error("Ошибка базы данных");
    }
}


module.exports = app;

