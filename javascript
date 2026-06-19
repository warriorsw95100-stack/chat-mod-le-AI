 const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");
    const loadingIndicator = document.getElementById("loading-indicator");
    const questionList = document.getElementById("question-list");
    const toggleButton = document.getElementById("toggle-questions");
    const savedQuestionsDropdown = document.getElementById("saved-questions-dropdown");

    let autoScrollEnabled = true;

    function isAtBottom() {
        return chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 40;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatMessages.addEventListener("scroll", function () {
        autoScrollEnabled = isAtBottom();
    });

    const OLLAMA_API_URL = "http://localhost:11434/api/chat";

    const STORAGE_KEY = "chatHistory";
    const history = [];

    function saveHistory() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function loadHistory() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function appendBubble(role, text, save = true) {
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${role}`;

        const title = document.createElement("strong");
        title.textContent = role === "user" ? "Vous" : "Assistant";

        const content = document.createElement("div");
        content.textContent = text;

        bubble.appendChild(title);
        bubble.appendChild(content);
        chatMessages.appendChild(bubble);

        if (save && autoScrollEnabled) {
            scrollToBottom();
        } else if (!save) {
            scrollToBottom();
        }

        if (save) {
            history.push({ role, content: text });
            saveHistory();
            renderSavedQuestions();
        }
    }

    function renderSavedQuestions() {
        questionList.innerHTML = "";
        history.forEach((message) => {
            const item = document.createElement("div");
            item.className = `question-item ${message.role}`;
            item.textContent = `${message.role === "user" ? "Vous" : "Assistant"} : ${message.content}`;
            questionList.appendChild(item);
        });
    }

    function restoreHistory() {
        const storedMessages = loadHistory();
        storedMessages.forEach((message) => {
            appendBubble(message.role, message.content, false);
            history.push({ role: message.role, content: message.content });
        });
        renderSavedQuestions();
        scrollToBottom();
    }

    function toggleDropdown() {
        const visible = savedQuestionsDropdown.classList.toggle("visible");
        toggleButton.textContent = visible ? "Masquer les questions" : "Voir les questions";
    }

    function clearHistory() {
        history.length = 0;
        localStorage.removeItem(STORAGE_KEY);
        questionList.innerHTML = "";
        savedQuestionsDropdown.classList.remove("visible");
        toggleButton.textContent = "Voir les questions";
    }

    restoreHistory();

    toggleButton.addEventListener("click", function () {
        toggleDropdown();
    });

    const resetButton = document.getElementById("reset-history");
    resetButton.addEventListener("click", function () {
        clearHistory();
    });

    const settingsButton = document.getElementById("settings-button");
    const settingsPanel = document.getElementById("settings-panel");
    const themeToggle = document.getElementById("theme-toggle");
    const THEME_STORAGE_KEY = "chatTheme";

    function applyTheme(theme) {
        const dark = theme === "dark";
        document.body.classList.toggle("dark-mode", dark);
        themeToggle.textContent = dark ? "Désactiver le mode sombre" : "Activer le mode sombre";
        settingsPanel.setAttribute("aria-hidden", dark ? "false" : "false");
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    function loadTheme() {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === "dark" || storedTheme === "light") {
            applyTheme(storedTheme);
        }
    }

    settingsButton.addEventListener("click", function () {
        settingsPanel.classList.toggle("visible");
    });

    themeToggle.addEventListener("click", function () {
        const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
        applyTheme(currentTheme === "dark" ? "light" : "dark");
    });

    loadTheme();

    chatForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const question = userInput.value.trim();
        if (!question) return;

        appendBubble("user", question);
        userInput.value = "";
        userInput.focus();

        loadingIndicator.style.display = "flex";

        try {
            const response = await fetch(OLLAMA_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama3.2:3b",
                    messages: [
                        {
                            role: "system",
                            content: "Vous êtes un assistant IA en français. Répondez de façon claire et concise.",
                        },
                        {
                            role: "user",
                            content: question,
                        },
                    ],
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            const answer = data?.message?.content || "Je n'ai pas reçu de réponse.";
            appendBubble("assistant", answer);
        } catch (error) {
            appendBubble("assistant", "Erreur lors de la requête : " + error.message);
        } finally {
            loadingIndicator.style.display = "none";
        }
    });
});




