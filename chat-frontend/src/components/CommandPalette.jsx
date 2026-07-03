import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCommandPalette } from "../hooks/useCommandPalette";
import { Search, MessageCircle } from "lucide-react";
import API from "../services/api";

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useCommandPalette();
    const [query, setQuery] = useState("");
    const [chats, setChats] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const modalRef = useRef(null);
    const navigate = useNavigate();

    // Fetch user's chats when the palette opens
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setActiveIndex(0);
            fetchChats();
            // Need a slight delay to autofocus correctly due to React rendering
            setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 50);
        }
    }, [isOpen]);

    const fetchChats = async () => {
        try {
            setLoading(true);
            const res = await API.get("/chats");
            setChats(res.data.data || []);
        } catch (error) {
            console.error("Failed to load chats for palette", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get chat name safely
    const getChatName = (chat) => {
        if (chat.isGroupChat) return chat.name;
        // In global context, we don't strictly have the currentUser object directly unless from localStorage
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const other = chat.participants?.find((p) => p._id !== currentUser._id);
        return other?.name || "Unknown User";
    };

    // Filtered chats based on query
    const filteredChats = chats.filter(chat => {
        const name = getChatName(chat).toLowerCase();
        return name.includes(query.toLowerCase());
    });

    // Handle keyboard navigation and FocusTrap
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === "Escape") {
                setIsOpen(false);
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => (prev < filteredChats.length - 1 ? prev + 1 : prev));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filteredChats.length > 0 && filteredChats[activeIndex]) {
                    const selectedChat = filteredChats[activeIndex];
                    setIsOpen(false);
                    // Trigger a navigation event to the specific chat
                    navigate(`/chat?chatId=${selectedChat._id}`);
                }
            } else if (e.key === "Tab") {
                // Focus Trap logic: Prevent tabbing out
                e.preventDefault();
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, filteredChats, activeIndex, navigate, setIsOpen]);

    // Reset active index when query changes
    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="cmd-palette-overlay" onClick={() => setIsOpen(false)} role="dialog" aria-modal="true" aria-label="Command Palette">
            <div className="cmd-palette-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
                <div className="cmd-palette-header">
                    <Search className="cmd-palette-icon" size={20} aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="cmd-palette-input"
                        placeholder="Search chats... (e.g. Rin, Selvam)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search input"
                    />
                </div>
                
                <div className="cmd-palette-list" role="listbox">
                    {loading && <div className="cmd-palette-message">Loading...</div>}
                    {!loading && filteredChats.length === 0 && (
                        <div className="cmd-palette-message">No chats found.</div>
                    )}
                    {!loading && filteredChats.map((chat, index) => (
                        <div
                            key={chat._id}
                            role="option"
                            aria-selected={index === activeIndex}
                            className={`cmd-palette-item ${index === activeIndex ? "active" : ""}`}
                            onClick={() => {
                                setIsOpen(false);
                                navigate(`/chat?chatId=${chat._id}`);
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                        >
                            <MessageCircle size={18} className="cmd-item-icon" aria-hidden="true" />
                            <span className="cmd-item-text">{getChatName(chat)}</span>
                        </div>
                    ))}
                </div>
                <div className="cmd-palette-footer">
                    <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
                    <span><kbd>Enter</kbd> to select</span>
                    <span><kbd>Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
}
