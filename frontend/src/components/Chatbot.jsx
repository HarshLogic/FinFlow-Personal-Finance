import React, { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { themes } from "../shared";
import { getSummary } from "../api";

const C = themes.dark;

const QA_KNOWLEDGE = [
  {
    keywords: ["what is finance flow", "about finance flow", "what do you do"],
    answer: "Finance Flow is a personal finance management application that helps you track expenses, income, investments, transactions, monthly spending and overall wealth in one place."
  },
  {
    keywords: ["track expense", "add expense", "how to track expenses", "log expense"],
    answer: "Go to the Expense Tracker and add your expense with the required details. You can categorize it as a Need or Want and Finance Flow will include it in your spending analysis."
  },
  {
    keywords: ["needs and wants", "difference between need", "what is a need", "what is a want"],
    answer: "Needs are essential expenses such as rent, food, bills or transportation. Wants are non-essential expenses such as entertainment, shopping or other optional spending."
  },
  {
    keywords: ["monthly spending calculated", "calculate spending"],
    answer: "Your monthly spending is calculated using the total of your Need expenses and Want expenses for the selected month."
  },
  {
    keywords: ["track income", "add income", "manage income"],
    answer: "Yes. Finance Flow allows you to add and manage your income and use it along with your expenses to understand your monthly financial position."
  },
  {
    keywords: ["total wealth", "what is wealth", "my wealth"],
    answer: "Total Wealth represents the combined value of your tracked financial assets and investments in Finance Flow."
  },
  {
    keywords: ["track investment", "add investment", "portfolio", "stocks", "mutual funds", "fixed deposits"],
    answer: "Yes. Finance Flow can track different investment categories such as stocks, mutual funds, fixed deposits and liquid investments."
  },
  {
    keywords: ["delete transaction", "remove transaction"],
    answer: "Yes, if the relevant transaction supports deletion, you can remove it from the corresponding transaction section."
  },
  {
    keywords: ["analytics", "charts", "see my financial"],
    answer: "Yes. Finance Flow provides charts and analytics to help you understand your expenses, income and financial activity in the Dashboard."
  },
  {
    keywords: ["why use finance flow", "why should i use"],
    answer: "Finance Flow brings your income, expenses, investments and financial summaries together so you can understand where your money is going and monitor your overall financial position."
  },
  // Added by agent:
  {
    keywords: ["who are you", "what are you", "chatbot name"],
    answer: "I am the Finance Flow AI Assistant! I'm here to help you navigate the app, explain financial concepts, and give you quick insights into your financial data."
  },
  {
    keywords: ["projection", "future wealth", "predict wealth", "wealth projection"],
    answer: "You can use the Wealth Projections tab to forecast your future net worth based on your current savings rate and expected market returns!"
  },
  {
    keywords: ["investment planner", "plan investment", "allocate"],
    answer: "Check out the new Invest Planner tab! It helps you smartly allocate your monthly income across diverse asset classes like Stocks, Mutual Funds, and Gold based on your personal risk appetite."
  },
  {
    keywords: ["user profile", "change password", "my account"],
    answer: "You can view your account details and manage your password securely by clicking the 'User Profile' button at the bottom of the sidebar."
  }
];

export default function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your Finance Flow Assistant. How can I help you manage your finances today?" }
  ]);
  const [input, setInput] = useState("");
  const [summaryData, setSummaryData] = useState(null);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      getSummary().then(res => setSummaryData(res.data)).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const getBotResponse = (userText) => {
    const text = userText.toLowerCase();

    // 1. Check for data-specific questions
    if (text.includes("my total wealth") || text.includes("how much wealth") || text.includes("current wealth") || text.includes("my net worth")) {
      if (summaryData?.totalWealth) {
        return `Based on your portfolio, your Total Wealth is currently \${summaryData.totalWealth.toLocaleString()}!`;
      }
      return "You currently have a Total Wealth of ₹0. Try adding some investments or income first!";
    }
    
    if (text.includes("my liquid cash") || text.includes("remaining balance") || text.includes("how much cash")) {
      if (summaryData?.liquidBal !== undefined) {
        return `Your remaining Liquid Cash balance is \${summaryData.liquidBal.toLocaleString()}.`;
      }
      return "I couldn't fetch your liquid cash balance at the moment.";
    }

    if (text.includes("my income") || text.includes("total income")) {
      if (summaryData?.totalIncome !== undefined) {
        return `You have recorded a total all-time income of \${summaryData.totalIncome.toLocaleString()}.`;
      }
    }

    if (text.includes("my expenses") || text.includes("total expenses") || text.includes("how much did i spend")) {
      if (summaryData?.totalExpenses !== undefined) {
        return `Your total tracked expenses amount to \${summaryData.totalExpenses.toLocaleString()}.`;
      }
    }

    // 2. Check Static Knowledge Base
    for (const item of QA_KNOWLEDGE) {
      for (const keyword of item.keywords) {
        if (text.includes(keyword)) {
          return item.answer;
        }
      }
    }

    // 3. Fallback
    return "I'm sorry, that feature may not currently be available in Finance Flow, or I don't have the answer to that. I am strictly focused on helping you with Finance Flow features and your personal finance data!";
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");

    // Simulate small delay for natural feeling
    setTimeout(() => {
      const response = getBotResponse(userMsg);
      setMessages(prev => [...prev, { role: "assistant", text: response }]);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 90,
      right: 30,
      width: 350,
      height: 500,
      backgroundColor: C.surface,
      border: `1px solid \${C.border}`,
      borderRadius: 16,
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      zIndex: 9999,
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        backgroundColor: C.card,
        borderBottom: `1px solid \${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: `1px solid \${C.border}` }}>
            <img src="/chatbot.jpg" alt="Agent" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Finance Flow Assistant</div>
            <div style={{ fontSize: 11, color: C.emerald }}>● Online</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}>
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            flexDirection: msg.role === "user" ? "row-reverse" : "row"
          }}>
            {msg.role === "assistant" && (
              <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <img src="/chatbot.jpg" alt="Bot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{
              padding: "10px 14px",
              borderRadius: 16,
              borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
              borderBottomRightRadius: msg.role === "user" ? 4 : 16,
              backgroundColor: msg.role === "user" ? C.emerald : C.card,
              color: msg.role === "user" ? "#000" : C.text,
              fontSize: 13,
              lineHeight: 1.5,
              border: msg.role === "assistant" ? `1px solid \${C.border}` : "none"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 16, borderTop: `1px solid \${C.border}`, backgroundColor: C.card }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Finance Flow..."
            style={{
              flex: 1,
              backgroundColor: C.surface,
              border: `1px solid \${C.border}`,
              borderRadius: 20,
              padding: "10px 16px",
              color: C.text,
              fontSize: 13,
              outline: "none"
            }}
          />
          <button
            type="submit"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              backgroundColor: C.gold,
              border: "none",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <Send size={16} style={{ marginLeft: -2 }} />
          </button>
        </form>
      </div>
    </div>
  );
}
