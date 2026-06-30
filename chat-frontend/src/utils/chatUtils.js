export const getChatName = (chat, currentUser) => {
    if (chat.isGroupChat) return chat.name;
    const other = chat.participants?.find((p) => p._id !== currentUser._id);
    return other?.name || "Unknown User";
};

export const getInitial = (chat, currentUser) => {
    if (chat.isGroupChat) return "G";
    const name = getChatName(chat, currentUser);
    return name ? name.charAt(0).toUpperCase() : "?";
};
