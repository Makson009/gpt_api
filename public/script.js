document.addEventListener("DOMContentLoaded", () => {
    const state = {
        section1: { button: null },
        section2: { button: null, fields: {} },
        section3: { button: null, fields: {} },
        section4: { fields: {} },
        section5: { correspondence: false, photos: false, witnesses: false, fields: {} },
        section6: { violations: "", selectedLaw: "" }
    };
    const slides = {
        start_screen: { prev: null, next: 'slide2' },
        slide2: { prev: 'start_screen', next: 'slide3' },
        slide3: { prev: 'slide2', next: 'slide4' },
        slide4: { prev: 'slide3', next: 'slide5' },
        slide5: { prev: 'slide4', next: 'slide6' },
        slide6: { prev: 'slide5', next: 'slide7' },
        slide7: { prev: 'slide6', next: 'slide_result_container' },
        slide_result_container: { prev: 'slide7', next: null }
        
    };
    
    let currentSlide = 'start_screen'; // Изначально показываем первый слайд

    // Функция скрытия всех слайдов
    function hideAllSlides() {
        const allSlides = document.querySelectorAll('[id^="slide"]'); // Все элементы с id, начинающимся на "slide"
        allSlides.forEach(slide => {
            slide.style.display = 'none'; // Скрываем все слайды
        });
    }

    // Функция отображения текущего слайда
    function showSlide(slideId) {
        hideAllSlides();  // Скрываем все слайды
        const currentSlide = document.getElementById(slideId);  // Ищем слайд по id
        if (currentSlide) {
            currentSlide.style.display = 'block'; // Показываем текущий слайд
        }
    }

    // Показываем стартовый слайд
    showSlide(currentSlide);

    // Обработчик кнопки "Далее"
    document.querySelectorAll(".next-button").forEach(button => {
        button.addEventListener("click", () => {
            console.log("Текущий слайд:", currentSlide); // Лог текущего слайда
            const nextSlide = slides[currentSlide].next;
            console.log("Следующий слайд:", nextSlide); // Лог следующего слайда

            if (nextSlide) {
                currentSlide = nextSlide;  // Обновляем текущий слайд
                console.log("Переход к слайду:", currentSlide); // Лог перехода
                showSlide(currentSlide);   // Показываем новый слайд
            }
        });
    });


    // Обработчик кнопки "Назад"
    document.querySelectorAll(".previous-button").forEach(button => {
        button.addEventListener("click", () => {
            const prevSlide = slides[currentSlide].prev;
            if (prevSlide) {
                currentSlide = prevSlide;  // Обновляем текущий слайд
                showSlide(currentSlide);   // Показываем новый слайд
            }
        });
    });

    // Обработчик кнопки "Начать" (для стартового слайда)
    document.querySelector("#start-button").addEventListener("click", () => {
        hideAllSlides();
        document.querySelector("#main-content").style.display = 'block';
        document.getElementById("start_screen").style.display = "none"; // скрываем стартовый экран
        currentSlide = 'slide2';  
        showSlide(currentSlide);  
    });
    


    // Обработчик чекбоксов в разделе 5
    document.querySelectorAll('[data-section="section5"]').forEach(checkbox => {
        checkbox.addEventListener("change", (event) => {
            const field = event.target.dataset.field;
            state.section5[field] = event.target.checked;
            console.log("Доказательства:", state.section5);
        });
    });

        // Функция для отображения текста в разделе 6
    function updateSituationSummary() {
        const summaryElement = document.getElementById("situation-summary");
        if (summaryElement) {
            // Получаем значения из раздела 4
            const situationText = state.section4.fields.agreements + "\n" + state.section4.fields.problem;
            // Обновляем содержимое элемента
            summaryElement.textContent = situationText;
        }
    }

    // Можно вызвать updateSituationSummary, например, при изменении данных в разделе 4
    document.addEventListener("input", (event) => {
        if (event.target.matches("[data-section='section4']")) {
            updateSituationSummary();
        }
    });
    
    



    // Функция для генерации списка законов
    const generateLaws = () => {
        const laws = [
            { id: "law1", title: "Статья 159 УК РФ — Мошенничество", text: "Определение мошенничества, ответственность за обман." },
            { id: "law2", title: "Статья 330 УК РФ — Самоуправство", text: "Незаконные действия вопреки установленному порядку." },
            { id: "law3", title: "Статья 165 УК РФ — Причинение имущественного ущерба", text: "Причинение ущерба без хищения, но с незаконными действиями." }
        ];

        const lawsList = document.getElementById("laws-list");
        lawsList.innerHTML = ""; // Очистка перед генерацией

        laws.forEach(law => {
            const button = document.createElement("button");
            button.textContent = law.title;
            button.classList.add("law-button");
            button.dataset.lawId = law.id;
            button.addEventListener("click", () => showLawDetails(law));
            lawsList.appendChild(button);
        });
    };

    // Функция для показа полной информации о законе
    const showLawDetails = (law) => {
        document.getElementById("law-details").textContent = law.text;
        state.section6.selectedLaw = law.title;
        console.log("Выбран закон:", state.section6.selectedLaw);
    };

    // Обработчик кнопки "Сгенерировать список законов"
    document.getElementById("generate-laws").addEventListener("click", generateLaws);

   
   
    // Универсальный обработчик для ввода в полях с использованием data-атрибутов
    document.addEventListener("input", (event) => {
        if (event.target.matches("[data-section][data-field]")) {
            const section = event.target.dataset.section;
            const field = event.target.dataset.field;
            state[section].fields[field] = event.target.value;
            console.log(`Обновлено: ${section} - ${field}:`, state[section].fields[field]);
        }
    });

    // Универсальная настройка кнопок и контента
    function setupSection(section) {
        const buttons = document.querySelectorAll(`.toggle-button[data-section="${section}"]`);
        const contents = document.querySelectorAll(`.content[data-section="${section}"]`);

        // Скрываем контент при загрузке страницы
        contents.forEach(content => {
            content.style.display = "none";
        });

        buttons.forEach(button => {
            button.addEventListener("click", (event) => {
                const targetId = event.target.dataset.target;
                
                // Обновляем состояние
                state[section].button = targetId;

                // Сбрасываем активный класс у всех кнопок данного раздела
                buttons.forEach(btn => btn.classList.remove("active"));

                // Добавляем активный класс для нажатой кнопки
                event.target.classList.add("active");

                // Скрываем весь контент в разделе
                contents.forEach(content => {
                    content.style.display = "none";
                });

                // Показываем целевой контент
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.style.display = "block";
                }

                console.log(`Выбрано в разделе ${section}:`, state[section].button);
            });
        });
    }

    // Настройка всех разделов с использованием нового подхода
    setupSection("section1");
    setupSection("section2");
    setupSection("section3");


    // Обработчик кнопки "Отправить"
    document.getElementById("submit-button").addEventListener("click", async () => {
        const data = {
            section1: state.section1,
            section2: state.section2,
            section3: state.section3,
            section4: state.section4,
        };
        // функция для проверки заполненных полей!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    

        console.log("Отправка данных:", data);

        try {
            const response = await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {

                console.log("Текущий слайд:", currentSlide); // Лог текущего слайда
                const nextSlide = slides[currentSlide].next;
                console.log("Следующий слайд:", nextSlide); // Лог следующего слайда

                if (nextSlide) {
                    currentSlide = nextSlide;  // Обновляем текущий слайд
                    console.log("Переход к слайду:", currentSlide); // Лог перехода
                    showSlide(currentSlide);   // Показываем новый слайд
                }
                
                const result = await response.json();
                console.log("Успешно отправлено:", result);

                // Обработка ответа от сервера
                const resultContainer = document.getElementById("slide_result_container");
                if (result.result) {
                    resultContainer.textContent = `Ответ от GPT: ${result.result}`;
                } else {
                    resultContainer.textContent = "Ответ не получен.";
                }

                alert("Данные успешно отправлены!");
            } else {
                console.error("Ошибка отправки:", response.statusText);
                alert("Ошибка при отправке данных.");
            }
        } catch (error) {
            console.error("Сбой отправки:", error);
            alert("Ошибка соединения с сервером.");
        }
    });
    
    // Для проверки состояния
    console.log("Начальное состояние:", state);
});
