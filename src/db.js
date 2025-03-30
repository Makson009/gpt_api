const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'gpt_api_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Проверка флага пользователя
async function checkUserFlag(userId) {
    const [rows] = await pool.execute('SELECT canRequestGPT FROM users WHERE id = ?', [userId]);
    return rows.length > 0 ? rows[0].canRequestGPT : false;
}

// Обновление флага
async function updateUserFlag(userId, flag) {
    await pool.execute('UPDATE users SET canRequestGPT = ? WHERE id = ?', [flag, userId]);
}

// Сохранение промпта и ответа
async function saveRequestData(userId, prompt, response) {
    await pool.execute('INSERT INTO requests (user_id, prompt, response) VALUES (?, ?, ?)', [userId, prompt, response]);
}

module.exports = { checkUserFlag, updateUserFlag, saveRequestData };
