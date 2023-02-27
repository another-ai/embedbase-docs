import React, { useState } from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import ReactMarkdown from "react-markdown";

const Modal = ({ children, open, onClose }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: 20,
          borderRadius: 5,
          width: "80%",
          maxWidth: 500,
          maxHeight: "80%",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const questions = ["What is Embedbase?"];

interface NiceSearchBarProps {
  value?: string;
  onChange?: (e: any) => void;
  autoFocus?: boolean;
  placeholder?: string;
  onClick?: () => void;
}

const NiceSearchBar = ({
  value,
  onChange,
  autoFocus,
  placeholder,
  onClick,
}: NiceSearchBarProps) => {
  return (
    // a magnifier icon on the left
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <input
        autoFocus={autoFocus || false}
        placeholder={placeholder || "Search..."}
        onClick={onClick}
        type="text"
        value={value}
        onChange={onChange}
        // border around with smooth corners, a magnifier icon on the left,
        // the search bar taking up the rest of the space
        // focused on load
        style={{
          width: "100%",
          padding: "0.5rem",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          outline: "none",
        }}
      />
    </div>
  );
};

const SearchModal = () => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);

  const onClose = () => {
    setOpen(false);
    setPrompt("");
    setOutput("");
    setLoading(false);
  };

  const qa = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setOutput("");
    const promptResponse = await fetch("/api/buildPrompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });
    const promptData = await promptResponse.json();
    const response = await fetch("/api/qa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: promptData.prompt,
      }),
    });
    console.log("Edge function returned.");
    setLoading(false);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setOutput((prev) => prev + chunkValue);
    }

    setLoading(false);
  };
  // a nice looking input search bar with cmd k to open
  // on open, show a modal with a form to enter a prompt
  return (
    <div>
      {/* on click, open modal */}
      <NiceSearchBar
        onClick={() => setOpen(true)}
        placeholder="Ask a question..."
      />
      <Modal open={open} onClose={onClose}>
        <form onSubmit={qa}>
          <NiceSearchBar
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            autoFocus
          />
          {/* <button type="submit">Ask</button> */}
        </form>
        {/* a spinner alongside a "loading" label when loading */}
        {/* the spinner is centered vertically and horizontally in the parent */}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              paddingTop: "1rem",
            }}
          >
            <span>Loading...</span>
            <div
              style={{
                width: "1rem",
                height: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "50%",
                borderTopColor: "black",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </div>
        )}

        <div style={{ padding: "2rem" }}>
          <ReactMarkdown>{output}</ReactMarkdown>
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: "1rem",
          }}
        >
          {/* try one of these samples */}
          <div style={{ marginTop: "1rem" }}>Try one of these samples:</div>
          <div
            style={{
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
            }}
          >
            {questions.map((q) => (
              <div onClick={() => setPrompt(q)}>{q}</div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.5rem 0",
              fontSize: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.25rem",
              }}
            >
              <a href="https://embedbase.xyz" className="underline">
                Powered by Embedbase
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const config: DocsThemeConfig = {
  logo: <span>Embedbase</span>,
  project: {
    link: "https://github.com/another-ai/embedbase",
  },
  chat: {
    link: "https://discord.gg/DYE6VFTJET",
  },
  docsRepositoryBase: "https://github.com/another-ai/embedbase-docs",
  footer: {
    text: "Embedbase Nextra Docs",
  },
  search: {
    component: <SearchModal />,
  },
};

export default config;
