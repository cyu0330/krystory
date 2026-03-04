// chat.js
(function () {
  const chatBox = document.getElementById("chatBox");
  const chatInput = document.getElementById("chatInput");
  const chatSend = document.getElementById("chatSend");
  const quickBtns = document.querySelectorAll("[data-quick]");

  if (!chatBox || !chatInput || !chatSend) return;

  // Minimal in-memory history (kept per page load)
  const history = [];

  function escapeHtml(str) {
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function addMessage(role, content) {
    const item = document.createElement("div");
    item.className = "chat-msg " + (role === "user" ? "chat-user" : "chat-assistant");
    item.innerHTML = `<div class="chat-bubble">${escapeHtml(content)}</div>`;
    chatBox.appendChild(item);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function setSending(isSending) {
    chatSend.disabled = isSending;
    chatSend.textContent = isSending ? "…" : "Send";
    chatInput.disabled = isSending;
  }

  async function sendToAssistant(userText, quickMode = null) {
    const trimmed = (userText || "").trim();
    if (!trimmed) return;

    addMessage("user", trimmed);
    history.push({ role: "user", content: trimmed });

    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          mode: quickMode, // "love" | "calm" | "focus" | null
          history: history.slice(-10), // keep last 10 turns
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }

      const data = await res.json();
      const reply = data?.reply || "Sorry — I couldn’t generate a reply.";
      addMessage("assistant", reply);
      history.push({ role: "assistant", content: reply });
    } catch (err) {
      addMessage("assistant", "⚠️ Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSending(false);
      chatInput.focus();
    }
  }

  // Button send
  chatSend.addEventListener("click", () => {
    sendToAssistant(chatInput.value);
    chatInput.value = "";
  });

  // Enter key
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      chatSend.click();
    }
  });

  // Quick buttons
  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-quick");
      const promptMap = {
        love: "I want love/relationship guidance. Suggest crystals and a gentle intention.",
        calm: "I feel anxious. Suggest calming crystals and a small grounding ritual.",
        focus: "I need focus and clarity. Suggest crystals and a simple focus routine.",
      };
      sendToAssistant(promptMap[mode] || "Suggest crystals for my intention.", mode);
    });
  });

  // First assistant message
  addMessage("assistant", "Hi ✨ Tell me how you feel, and I’ll suggest crystals + a simple intention.");
})();