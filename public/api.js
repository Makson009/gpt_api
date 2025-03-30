export async function submitData(data) {
    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        console.log("Отправка запроса на сервер...");
        fetch("http://localhost:3000/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId: "test", prompt: "Пример запроса" })
        })
        .then(response => response.json())
        .then(data => console.log("Ответ от сервера:", data))
        .catch(error => console.error("Ошибка запроса:", error));
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Ошибка соединения с сервером:", error);
        throw error;
    }
}
