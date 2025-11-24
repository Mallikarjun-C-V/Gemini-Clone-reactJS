import { createContext, useState } from "react";
import runChat from "../config/gemini";

export const Context = createContext();

const ContextProvider = ({ children }) => {
    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [prevPrompts, setPrevPrompts] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");

    // Image upload preview (BEFORE sending)
    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadedMimeType, setUploadedMimeType] = useState(null);

    // Image sent to backend (AFTER sending)
    const [sentImage, setSentImage] = useState(null);
    const [sentMime, setSentMime] = useState(null);

    const newChat = () => {
        setLoading(false);
        setShowResult(false);
        setSentImage(null);
        setSentMime(null);
    };

    const onSent = async (prompt) => {
        setResultData("");
        setLoading(true);
        setShowResult(true);

        let currentPrompt = prompt !== undefined ? prompt : input;
        if (prompt === undefined) setPrevPrompts(prev => [...prev, input]);

        setRecentPrompt(currentPrompt);

        // Save image as "sent" (for display above prompt)
        setSentImage(uploadedImage);
        setSentMime(uploadedMimeType);

        const response = await runChat(
            currentPrompt,
            uploadedImage,
            uploadedMimeType
        );

        setResultData(response || "");

        // Clear preview after sending
        setUploadedImage(null);
        setUploadedMimeType(null);

        setLoading(false);
        setInput("");

        return { sentImage, sentMime };
    };

    const contextValue = {
        prevPrompts,
        setPrevPrompts,
        onSent,
        setRecentPrompt,
        recentPrompt,
        showResult,
        loading,
        resultData,
        input,
        setInput,
        newChat,

        uploadedImage,
        setUploadedImage,
        uploadedMimeType,
        setUploadedMimeType,

        sentImage,
        sentMime,
    };

    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    );
};

export default ContextProvider;
