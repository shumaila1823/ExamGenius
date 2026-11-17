
import { useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menu = [
    { name: "Dashboard", icon: "🏠" },
    { name: "AI Notes Assistant", icon: "🤖" },
    { name: "My Study Materials", icon: "📚" },
    { name: "MCQ Practice", icon: "📝" },
    { name: "Mock Exams", icon: "⏱️" },
    { name: "My Performance", icon: "📊" },
  ];

  const changeTab = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const uploadPDF = async () => {
    if (!file) {
      setUploadMessage("Please select a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setUploadMessage("Uploading and processing your PDF...");

      const response = await fetch(`${API}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed.");
      }

      setUploadedFiles((previous) => [
        ...previous,
        {
          name: data.filename,
          pages: data.total_pages,
          chunks: data.stored_chunks,
        },
      ]);

      setUploadMessage(
        `Successfully uploaded ${data.filename}! ${data.total_pages} pages and ${data.stored_chunks} chunks stored.`
      );

      setFile(null);
    } catch (error) {
      setUploadMessage(`Upload error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const askAI = async (event) => {
    event.preventDefault();

    const currentQuestion = question.trim();

    if (!currentQuestion || asking) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: currentQuestion },
    ]);

    setQuestion("");
    setAsking(true);

    try {
      const response = await fetch(`${API}/ask-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not get an answer.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer || "No answer was returned.",
          sources: data.sources || [],
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `Sorry, something went wrong: ${error.message}`,
          sources: [],
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const openAI = () => changeTab("AI Notes Assistant");

  return (
    <div className="app">
      {menuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-icon">🎓</span>
          <span>ExamGenius</span>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav>
          {menu.map((item) => (
            <button
              key={item.name}
              className={
                activeTab === item.name ? "menu-item active" : "menu-item"
              }
              onClick={() => changeTab(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">S</div>
            <div>
              <strong>Student</strong>
              <small>ExamGenius Account</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="heading-area">
            <button
              className="mobile-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <h2>{activeTab}</h2>
              <p>Your personal exam preparation space</p>
            </div>
          </div>

          <div className="top-actions">
            <span title="Notifications">🔔</span>
            <span className="avatar">S</span>
          </div>
        </header>

        {activeTab === "Dashboard" && (
          <>
            <section className="welcome">
              <div>
                <span className="welcome-tag">YOUR LEARNING JOURNEY</span>
                <h1>Welcome to ExamGenius! 👋</h1>
                <p>Learn smarter, practice better and achieve your goals.</p>
                <button className="primary-btn" onClick={openAI}>
                  Explore AI Assistant →
                </button>
              </div>
              <div className="welcome-art">📖</div>
            </section>

            <section className="stats">
              <div className="stat-card">
                <span>📚</span>
                <p>Study Materials</p>
                <h2>{uploadedFiles.length}</h2>
                <small>Uploaded in this session</small>
              </div>

              <div className="stat-card">
                <span>📝</span>
                <p>Quizzes Completed</p>
                <h2>0</h2>
                <small>Practice sessions</small>
              </div>

              <div className="stat-card">
                <span>🎯</span>
                <p>Average Score</p>
                <h2>--</h2>
                <small>Start your first quiz</small>
              </div>

              <div className="stat-card">
                <span>⏰</span>
                <p>Study Time</p>
                <h2>0h</h2>
                <small>Keep learning</small>
              </div>
            </section>

            <h2 className="section-title">Learning Tools</h2>

            <section className="features">
              {menu.slice(1).map((item) => (
                <div className="feature-card" key={item.name}>
                  <span>{item.icon}</span>
                  <h3>{item.name}</h3>
                  <p>Explore your learning tools and improve your preparation.</p>
                  <button onClick={() => changeTab(item.name)}>
                    Open Feature →
                  </button>
                </div>
              ))}
            </section>
          </>
        )}

        {activeTab === "AI Notes Assistant" && (
          <section className="ai-layout">
            <div className="content-card upload-panel">
              <div className="panel-heading">
                <span className="large-icon">📚</span>
                <div>
                  <h2>Study Materials</h2>
                  <p>Upload your PDF notes to the ExamGenius library.</p>
                </div>
              </div>

              <div className="upload-box">
                <span className="upload-icon">📄</span>
                <h3>Upload PDF Notes</h3>
                <p>Select a text-based PDF from your computer.</p>

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) => {
                    setFile(event.target.files[0] || null);
                    setUploadMessage("");
                  }}
                />

                {file && <p className="selected-file">📎 {file.name}</p>}

                <button
                  className="primary-btn"
                  onClick={uploadPDF}
                  disabled={uploading}
                >
                  {uploading ? "Processing..." : "Upload and Process"}
                </button>

                {uploadMessage && (
                  <p className="upload-message">{uploadMessage}</p>
                )}
              </div>

              <div className="uploaded-list">
                <h3>Uploaded in this session</h3>
                {uploadedFiles.length === 0 ? (
                  <p>No files uploaded in this session yet.</p>
                ) : (
                  uploadedFiles.map((item, index) => (
                    <div className="file-row" key={`${item.name}-${index}`}>
                      <span>📄</span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {item.pages} pages · {item.chunks} chunks
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="content-card chat-panel">
              <div className="chat-heading">
                <div className="chat-avatar">🤖</div>
                <div>
                  <h2>Ask ExamGenius</h2>
                  <p>AI tutor powered by Gemini</p>
                </div>
                <span className="online-dot">● Online</span>
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-welcome">
                    <span>✨</span>
                    <h3>Hello, student!</h3>
                    <p>
                      Ask a question about your uploaded study materials.
                      I'll search your notes and help you understand them.
                    </p>
                    <div className="suggestions">
                      <button
                        onClick={() =>
                          setQuestion("Summarize my uploaded study notes.")
                        }
                      >
                        Summarize my notes
                      </button>
                      <button
                        onClick={() =>
                          setQuestion("Explain the main concepts in my notes.")
                        }
                      >
                        Explain main concepts
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    className={`message ${
                      message.role === "user" ? "user-message" : "ai-message"
                    }`}
                    key={index}
                  >
                    <div className="message-bubble">
                      <strong>
                        {message.role === "user" ? "You" : "ExamGenius"}
                      </strong>
                      <p>{message.text}</p>

                      {message.sources?.length > 0 && (
                        <div className="sources">
                          <strong>Sources:</strong>
                          {message.sources.map((source, sourceIndex) => (
                            <span key={sourceIndex}>📄 {source}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {asking && (
                  <div className="message ai-message">
                    <div className="message-bubble typing">
                      ExamGenius is thinking...
                    </div>
                  </div>
                )}
              </div>

              <form className="chat-form" onSubmit={askAI}>
                <input
                  type="text"
                  placeholder="Ask a question about your notes..."
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  disabled={asking}
                />
                <button
                  className="send-btn"
                  type="submit"
                  disabled={asking || !question.trim()}
                >
                  {asking ? "..." : "➤"}
                </button>
              </form>

              <p className="chat-note">
                Answers are based on information retrieved from your uploaded
                study materials.
              </p>
            </div>
          </section>
        )}

        {activeTab === "My Study Materials" && (
          <section className="content-card">
            <h1>📚 My Study Materials</h1>
            <p>Your uploaded materials in this session.</p>
            {uploadedFiles.length === 0 ? (
              <p>No materials uploaded yet.</p>
            ) : (
              uploadedFiles.map((item, index) => (
                <div className="file-row" key={`${item.name}-${index}`}>
                  📄
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.pages} pages · {item.chunks} chunks
                    </small>
                  </div>
                </div>
              ))
            )}
            <button className="primary-btn" onClick={openAI}>
              Upload more notes →
            </button>
          </section>
        )}

        {["MCQ Practice", "Mock Exams", "My Performance"].includes(
          activeTab
        ) && (
          <section className="content-card coming-soon">
            <span className="large-icon">🚀</span>
            <h1>{activeTab}</h1>
            <p>
              This feature is coming next. We're building your complete exam
              preparation platform step by step.
            </p>
            <button
              className="primary-btn"
              onClick={() => changeTab("Dashboard")}
            >
              Back to Dashboard
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
