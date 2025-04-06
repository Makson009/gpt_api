const app = require('./app'); // Импортируем только приложение (без запуска сервера)
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});

// Обработка ошибок
process.on('uncaughtException', (err) => {
    console.error('❌ Необработанная ошибка:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Обещание отклонено без обработки:', promise, 'Причина:', reason);
});
