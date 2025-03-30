import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Добавляем парсер JSON

app.post('/submit', (req, res) => {
    console.log("Получены данные:", req.body);
    res.json({ result: "Ваши данные успешно обработаны" });
});

// Раздаём статические файлы из папки frontend (путь поменяй под свой проект)
app.use(express.static(path.join(process.cwd(), "./public")));

// Запуск сервера
const server = app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});

// Обработчик ошибок
process.on('uncaughtException', (err) => {
    console.error('❌ Необработанная ошибка:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Обещание отклонено без обработки:', promise, 'Причина:', reason);
});

export default server;
