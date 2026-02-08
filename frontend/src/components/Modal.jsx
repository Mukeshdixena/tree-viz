import React, { useState, useEffect } from 'react';
import { X, AlertCircle, HelpCircle, MessageSquare } from 'lucide-react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, message, type, onConfirm, defaultValue = '', placeholder = '', hasInput = false, showSampleBtn = false, onSample }) => {
    const [inputValue, setInputValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) setInputValue(defaultValue);
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(hasInput ? inputValue : true);
        onClose();
    };

    const handleCancel = () => {
        onConfirm(false);
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'confirm': return <HelpCircle className="modal-info-icon confirm" size={24} />;
            case 'prompt': return <MessageSquare className="modal-info-icon prompt" size={24} />;
            default: return <AlertCircle className="modal-info-icon alert" size={24} />;
        }
    };

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="title-area">
                        {getIcon()}
                        <h3>{title}</h3>
                    </div>
                    <button className="modal-close-btn" onClick={handleCancel}><X size={18} /></button>
                </div>

                <div className="modal-body">
                    <p>{message}</p>
                    {hasInput && (
                        <input
                            type="text"
                            className="modal-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={placeholder}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        />
                    )}
                </div>

                <div className="modal-footer">
                    <div className="footer-left">
                        {showSampleBtn && (
                            <button className="modal-btn sample" onClick={() => { onSample(); onClose(); }}>
                                Use Sample
                            </button>
                        )}
                    </div>
                    <div className="footer-right">
                        <button className="modal-btn secondary" onClick={handleCancel}>Cancel</button>
                        <button className="modal-btn primary" onClick={handleConfirm}>
                            {type === 'prompt' ? 'Create' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
