import React, { useState } from 'react';
import './WelcomeModal.css';

const WelcomeModal = ({ onNameSubmit }) => {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (name.trim()) {
            onNameSubmit(name);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Welcome to Gemini</h2>
                <p>Please enter your name to get started.</p>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Your Name"
                    autoFocus
                />
                <button onClick={handleSubmit}>Continue</button>
            </div>
        </div>
    );
};

export default WelcomeModal;