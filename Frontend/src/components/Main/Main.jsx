import React, { useContext, useEffect, useState, useRef } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';
import ReactMarkdown from "react-markdown";

const Main = ({ displayedName, animationClass }) => {
    const { onSent, recentPrompt, showResult, loading, resultData, setInput, input } = useContext(Context);
    const [isLoaded, setIsLoaded] = useState(false);

    // --- Voice Recognition State ---
    const [isListening, setIsListening] = useState(false);
    const [timer, setTimer] = useState(0);
    const recognitionRef = useRef(null);
    const timerIntervalRef = useRef(null);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // --- Keyboard Shortcut Logic ---
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (document.activeElement.tagName !== 'INPUT' &&
                    document.activeElement.tagName !== 'TEXTAREA') {
                    const inputElement = document.querySelector('.search-box input');
                    if (inputElement) {
                        inputElement.focus();
                    }
                }
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, []);

    // --- Voice Logic (Frontend Only) ---
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Your browser does not support Speech Recognition. Try Chrome.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();

        recognitionRef.current.continuous = true;     // Keep listening even if user pauses
        recognitionRef.current.interimResults = true; // Real-time typing

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setTimer(0);
            timerIntervalRef.current = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        };

        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            // Loop through results to construct the sentence
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                finalTranscript += transcript;
            }
            // Update Input Context in Real-Time
            setInput(prev => finalTranscript);
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech recognition error", event.error);

            if (event.error === 'network') {
                alert("Network Error: Please check your internet connection. This feature requires being online.");
            } else if (event.error === 'not-allowed') {
                alert("Microphone blocked. Please allow microphone access in your browser settings.");
            } else if (event.error === 'no-speech') {
                alert("nothing")
                return;
            }

            stopListening();
        };

        recognitionRef.current.onend = () => {
            stopListening();
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
        clearInterval(timerIntervalRef.current);
    };

    // Format time for UI (mm:ss)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

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
                                    <ReactMarkdown>{resultData}</ReactMarkdown>
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
                        <div>
                            <img src={assets.gallery_icon} alt="" />
                            {/* Updated Mic Icon with Click Handler */}
                            <img
                                src={assets.mic_icon}
                                alt=""
                                onClick={startListening}
                                style={{ cursor: 'pointer' }}
                            />
                            {input && (
                                <img
                                    onClick={() => {
                                        onSent();
                                        setInput("");
                                    }}
                                    src={assets.send_icon}
                                    alt=""
                                />
                            )}
                        </div>
                    </div>
                    <p className="bottom-info">
                        Gemini may display inaccurate info, including about people, so double check its responses.
                    </p>
                </div>
            </div>

            {/* --- SIRI ANIMATION OVERLAY --- */}
            {isListening && (
                <div className="siri-overlay" onClick={stopListening}>
                    <div className="siri-container">
                        <div className="siri-orb"></div>
                        <div className="siri-orb-2"></div>
                        <div className="siri-orb-3"></div>
                    </div>
                    <div className="siri-text">Listening...</div>
                    <div className="siri-timer">{formatTime(timer)}</div>
                    <div className="siri-instruction">Tap anywhere to stop</div>
                </div>
            )}
        </div>
    );
};

export default Main;