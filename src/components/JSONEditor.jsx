import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { Save, AlertCircle, CheckCircle2, Braces } from 'lucide-react';
import './JSONEditor.css';

export default function JSONEditor({ data, onUpdate }) {
    const [code, setCode] = useState(JSON.stringify(data, null, 2));
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        setCode(JSON.stringify(data, null, 2));
    }, [data]);

    const handleValueChange = (newCode) => {
        setCode(newCode);
        try {
            const parsed = JSON.parse(newCode);
            setError(null);
            onUpdate(parsed);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
        } catch (err) {
            setError(err.message);
            setIsSuccess(false);
        }
    };

    const formatJSON = () => {
        try {
            const parsed = JSON.parse(code);
            const formatted = JSON.stringify(parsed, null, 2);
            setCode(formatted);
            setError(null);
        } catch (err) {
            setError("Cannot format invalid JSON: " + err.message);
        }
    };

    const resetData = () => {
        if (window.confirm("Are you sure you want to reset all data to default?")) {
            handleValueChange(JSON.stringify(data, null, 2));
        }
    };

    return (
        <div className="json-editor-container">
            <div className="editor-header">
                <div className="editor-title">
                    <Braces size={18} />
                    <span>JSON Schema Editor</span>
                </div>
                <div className="header-actions">
                    <button className="header-btn" onClick={formatJSON} title="Format JSON">
                        Format
                    </button>
                    <button className="header-btn secondary" onClick={resetData} title="Reset to Current Data">
                        Reset
                    </button>
                </div>
            </div>


            <div className="editor-wrapper">
                <Editor
                    value={code}
                    onValueChange={handleValueChange}
                    highlight={code => highlight(code, languages.json)}
                    padding={20}
                    className="code-editor"
                    style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 14,
                        minHeight: '100%',
                    }}
                />
            </div>

            <div className="editor-footer">
                {error ? (
                    <div className="status-error">
                        <AlertCircle size={14} />
                        <span>Invalid JSON: {error}</span>
                    </div>
                ) : (
                    <div className={`status-success ${isSuccess ? 'visible' : ''}`}>
                        <CheckCircle2 size={14} />
                        <span>Valid & Synced</span>
                    </div>
                )}
            </div>
        </div>
    );
}
