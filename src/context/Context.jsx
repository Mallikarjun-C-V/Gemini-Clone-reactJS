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

    const delayPara = (index, nextWord) => {
        setTimeout(function () {
            setResultData(prev => prev + nextWord + " ");
        }, 75 * index);
    };

    const newChat = () => {
        setLoading(false);
        setShowResult(false);
    };

    const onSent = async (prompt) => {
        setResultData("");
        setLoading(true);
        setShowResult(true);

        let currentPrompt = prompt !== undefined ? prompt : input;

        if (prompt === undefined) {
            setPrevPrompts(prev => [...prev, input]);
        }

        setRecentPrompt(currentPrompt);
        const response = await runChat(currentPrompt);

        // --- Logic ---

        // bold
        let boldResponse = response.replace(/\*\*(.*?)\*\*/g, '<b style="font-weight: 700;">$1</b>');

        // bullett
        let listResponse = boldResponse.replace(/^\s*\*(.*)/gm, '<br>• $1');

        // next line
        let finalResponse = listResponse.replace(/\n/g, '<br>');

        let newResponseArray = finalResponse.split(" ");
        for (let i = 0; i < newResponseArray.length; i++) {
            const nextWord = newResponseArray[i];
            delayPara(i, nextWord);
        }

        setLoading(false);
        setInput("");
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
        newChat
    };

    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    );
};

export default ContextProvider;