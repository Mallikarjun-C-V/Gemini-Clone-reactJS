import React, { useContext, useEffect, useState, useRef } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';
import ReactMarkdown from "react-markdown";

const Main = ({ displayedName, animationClass }) => {
    const { onSent, recentPrompt, showResult, loading, resultData, setInput, input } = useContext(Context);
    const [isLoaded, setIsLoaded] = useState(false);

    // Typing effect
    const [displayedText, setDisplayedText] = useState("");

    // TTS State (no auto speak)
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Action buttons state
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Small Gemini-like notification (appears center, ~50px from top)
    const [notice, setNotice] = useState({ visible: false, text: '' });
    const noticeTimerRef = useRef(null);

    // Voice Recognition
    const [isListening, setIsListening] = useState(false);
    const [timer, setTimer] = useState(0);
    const recognitionRef = useRef(null);
    const timerIntervalRef = useRef(null);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    /* ----------------------------------
       TEXT-TO-SPEECH (NO AUTO SPEAK)
    ------------------------------------*/
    const speakText = (text) => {
        if (!window.speechSynthesis) {
            alert("Speech Synthesis not supported in this browser.");
            return;
        }

        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.rate = 1;
        utter.pitch = 1;

        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utter);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    /* ----------------------------------
       TYPING EFFECT
    ------------------------------------*/
    useEffect(() => {
        if (!loading && resultData) {
            setDisplayedText("");
            const words = resultData.split(" ");
            let i = 0;

            const interval = setInterval(() => {
                if (i < words.length) {
                    setDisplayedText(prev => prev + words[i] + " ");
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 20);

            return () => clearInterval(interval);
        }
    }, [resultData, loading]);

    /* ----------------------------------
       VOICE INPUT (RECOGNITION)
    ------------------------------------*/
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setTimer(0);
            timerIntervalRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        };

        recognitionRef.current.onresult = (event) => {
            let text = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            setInput(text);
        };

        recognitionRef.current.onerror = () => stopListening();
        recognitionRef.current.onend = () => stopListening();

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        clearInterval(timerIntervalRef.current);
        setIsListening(false);
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    /* ----------------------------------
       ACTIONS: like / dislike / refresh / copy / dots
    ------------------------------------*/
    const handleLike = () => {
        setLiked(prev => {
            const next = !prev;
            // if liking, clear dislike
            if (next && disliked) setDisliked(false);
            return next;
        });
    };

    const handleDislike = () => {
        setDisliked(prev => {
            const next = !prev;
            // if disliking, clear like
            if (next && liked) setLiked(false);
            return next;
        });
    };

    const showNotice = (text) => {
        // Clear existing
        if (noticeTimerRef.current) {
            clearTimeout(noticeTimerRef.current);
            noticeTimerRef.current = null;
        }
        setNotice({ visible: true, text });
        noticeTimerRef.current = setTimeout(() => {
            setNotice({ visible: false, text: '' });
            noticeTimerRef.current = null;
        }, 1600);
    };

    const handleCopy = async () => {
        try {
            if (!resultData) return;
            await navigator.clipboard.writeText(resultData);
            showNotice('Text copied to clipboard');
        } catch (err) {
            showNotice('Unable to copy');
            console.error('copy error', err);
        }
    };

    const handleRefresh = async () => {
        // disable while refreshing
        if (isRefreshing) return;
        if (!recentPrompt) {
            showNotice('Nothing to refresh');
            return;
        }

        setIsRefreshing(true);

        // Put recentPrompt into input then call onSent()
        // onSent is expected to send the input to the backend
        setInput(recentPrompt);
        try {
            // If onSent is synchronous or handles its own async flow this will work.
            onSent();
        } catch (err) {
            console.error('refresh send failed', err);
        } finally {
            // clear input after sending (keeps behaviour consistent)
            setInput('');
            // small delay to avoid rapid clicks
            setTimeout(() => setIsRefreshing(false), 800);
        }
    };

    const handleDots = () => {
        showNotice('No more features available');
    };

    /* ----------------------------------
       AUTOFOCUS ON TYPING (previous feature)
    ------------------------------------*/
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeTag = document.activeElement.tagName;
                if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
                    const inputBox = document.querySelector('.search-box input');
                    if (inputBox) {
                        inputBox.focus();
                    }
                }
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, []);

    /* ----------------------------------
       CLEANUP notice timer on unmount
    ------------------------------------*/
    useEffect(() => {
        return () => {
            if (noticeTimerRef.current) {
                clearTimeout(noticeTimerRef.current);
            }
        };
    }, []);

    /* ----------------------------------
       RENDER
    ------------------------------------*/
    return (
        <div className={`main ${isLoaded ? 'loaded' : ''}`}>
            <div className="nav">
                <p>Gemini</p>
                <img className='z1' src={assets.user_icon} alt="" />
            </div>

            <div className="main-container">
                {!showResult ? (
                    <>
                        <div className="greet">
                            <div className="greet-line">
                                <span>
                                    Hello,{" "}
                                    <span className="greet-name-container">
                                        <span className={`greet-name ${animationClass}`}>
                                            {displayedName}
                                        </span>
                                    </span>
                                </span>
                            </div>
                            <p>How can I help u today</p>
                        </div>

                        <div className="cards">
                            <div className="card">
                                <p>Suggest beautiful places to see on an upcoming roadtrip</p>
                                <img src={assets.compass_icon} alt="" />
                            </div>
                            <div className="card c1">
                                <p>Briefly summarize this concept : urban planning</p>
                                <img src={assets.bulb_icon} alt="" />
                            </div>
                            <div className="card c1">
                                <p>Brainstorm team bonding activities for our work retreat</p>
                                <img src={assets.message_icon} alt="" />
                            </div>
                            <div className="card c1">
                                <p>Improve the readability of the following code</p>
                                <img src={assets.code_icon} alt="" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="result">
                        <div className="result-title">
                            <img src={assets.user_icon} alt="" />
                            <p>{recentPrompt}</p>
                        </div>

                        <div className="result-data">
                            <img src={assets.gemini_icon} alt="" />

                            {loading ? (
                                <div className="loader">
                                    <hr /><hr /><hr />
                                </div>
                            ) : (
                                <div className="markdown-output">
                                    <ReactMarkdown>{displayedText}</ReactMarkdown>

                                    {/* ACTION ROW (LIKE / DISLIKE / REFRESH / COPY / DOTS) */}
                                    <div className="action-row">

                                        {/* LIKE */}
                                        <button
                                            className={`action-btn ${liked ? "active" : ""}`}
                                            onClick={handleLike}
                                            title="Like"
                                        >
                                            <i className="fa-solid fa-thumbs-up"></i>
                                        </button>

                                        {/* DISLIKE */}
                                        <button
                                            className={`action-btn ${disliked ? "active" : ""}`}
                                            onClick={handleDislike}
                                            title="Dislike"
                                        >
                                            <i className="fa-solid fa-thumbs-down"></i>
                                        </button>

                                        {/* REFRESH */}
                                        <button
                                            className="action-btn"
                                            onClick={handleRefresh}
                                            disabled={isRefreshing || loading}
                                            title="Refresh"
                                        >
                                            <i className="fa-solid fa-rotate-right"></i>
                                        </button>

                                        {/* COPY */}
                                        <button
                                            className="action-btn"
                                            onClick={handleCopy}
                                            title="Copy"
                                        >
                                            <i className="fa-solid fa-copy"></i>
                                        </button>

                                        {/* THREE DOTS (VERTICAL) */}
                                        <button
                                            className="action-btn"
                                            onClick={handleDots}
                                            title="More Options"
                                        >
                                            <i className="fa-solid fa-ellipsis-vertical"></i>
                                        </button>

                                    </div>


                                    {/* TTS Controls (Speak / Stop) */}
                                    <div className="tts-controls">
                                        <button
                                            className="tts-btn speak"
                                            onClick={() => speakText(resultData)}
                                        >
                                            🔊 Speak
                                        </button>

                                        {isSpeaking && (
                                            <button
                                                className="tts-btn stop"
                                                onClick={stopSpeaking}
                                            >
                                                ⛔ Stop
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="main-bottom">
                    <div className="search-box">
                        <input
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && input) {
                                    onSent();
                                    setInput("");
                                }
                            }}
                            value={input}
                            type="text"
                            placeholder="Enter a prompt here"
                        />

                        <div className="search-actions">
                            <img
                                src={assets.mic_icon}
                                alt=""
                                onClick={startListening}
                                style={{ cursor: 'pointer' }}
                            />

                            <img
                                onClick={() => {
                                    if (input) {
                                        onSent();
                                        setInput("");
                                    }
                                }}
                                src={assets.send_icon}
                                alt="send-icon"
                                style={{
                                    cursor: input ? "pointer" : "not-allowed",
                                    filter: input ? "none" : "grayscale(100%) opacity(40%)"
                                }}
                            />
                        </div>
                    </div>

                    <p className="bottom-info">
                        Gemini may display inaccurate info, including about people, so double check its responses.
                    </p>
                </div>
            </div>

            {/* LISTENING OVERLAY */}
            {isListening && (
                <div className="voice-overlay" onClick={stopListening}>
                    <div className="voice-content">
                        <h2>Listening...</h2>
                        <p>{formatTime(timer)}</p>
                    </div>
                </div>
            )}

            {/* Gemini-like small notification (not a third-party toast) */}
            {notice.visible && (
                <div className="gemini-notice" role="status" aria-live="polite">
                    {notice.text}
                </div>
            )}
        </div>
    );
};

export default Main;
