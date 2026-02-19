import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, AlertCircle, CheckCircle2, Braces, Copy, WrapText } from 'lucide-react';
import './JSONEditor.css';

// Simple JSON syntax highlighter (no external deps needed beyond what we already have)
function highlightJSON(code) {
    return code
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Strings (keys and values)
        .replace(/"((?:[^"\\]|\\.)*)"/g, (m, inner) => {
            // Check if it's a key (followed by colon)
            return `<span class="jt-string">"${inner}"</span>`;
        })
        // Numbers
        .replace(/(?<!["\w])(-?\d+\.?\d*(?:[eE][+-]?\d+)?)(?!["\w])/g, '<span class="jt-number">$1</span>')
        // Booleans
        .replace(/\b(true|false)\b/g, '<span class="jt-bool">$1</span>')
        // Null
        .replace(/\bnull\b/g, '<span class="jt-null">null</span>')
        // Keys specifically (re-color after colon detection)
        .replace(/<span class="jt-string">"([^"]*)"<\/span>(\s*:)/g, '<span class="jt-key">"$1"</span>$2')
        // Braces & brackets
        .replace(/([{}[\]])/g, '<span class="jt-brace">$1</span>');
}

export default function JSONEditor({ data, onUpdate }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [wordWrap, setWordWrap] = useState(false);
    const [copied, setCopied] = useState(false);
    const [lineCount, setLineCount] = useState(1);

    const textareaRef = useRef(null);
    const highlightRef = useRef(null);
    const gutterRef = useRef(null);
    const scrollRef = useRef(null);

    // Init/reset code when data changes externally
    useEffect(() => {
        const formatted = JSON.stringify(data, null, 2);
        setCode(formatted);
        setLineCount(formatted.split('\n').length);
    }, [data]);

    // Sync scroll between textarea and highlight layer + gutter
    const syncScroll = useCallback(() => {
        if (!scrollRef.current || !highlightRef.current || !gutterRef.current) return;
        const { scrollTop, scrollLeft } = scrollRef.current;
        highlightRef.current.scrollTop = scrollTop;
        highlightRef.current.scrollLeft = scrollLeft;
        gutterRef.current.scrollTop = scrollTop;
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setCode(val);
        const lines = val.split('\n').length;
        setLineCount(lines);
        setSaved(false);

        try {
            JSON.parse(val);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSave = () => {
        try {
            const parsed = JSON.parse(code);
            setError(null);
            onUpdate(parsed);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(code);
            const formatted = JSON.stringify(parsed, null, 2);
            setCode(formatted);
            setLineCount(formatted.split('\n').length);
            setError(null);
        } catch (err) {
            setError('Cannot format: ' + err.message);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Tab key support
    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newVal = code.substring(0, start) + '  ' + code.substring(end);
            setCode(newVal);
            // restore cursor after state update
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = start + 2;
                    textareaRef.current.selectionEnd = start + 2;
                }
            });
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
    };

    const highlighted = highlightJSON(code);
    const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
        <div className="vsc-editor">
            {/* Title bar */}
            <div className="vsc-titlebar">
                <div className="vsc-title-left">
                    <div className="vsc-dots">
                        <span className="vsc-dot red" />
                        <span className="vsc-dot yellow" />
                        <span className="vsc-dot green" />
                    </div>
                    <Braces size={14} className="vsc-title-icon" />
                    <span className="vsc-filename">schema.json</span>
                    {!error && code && <span className="vsc-modified" title="Unsaved changes" />}
                </div>
                <div className="vsc-title-right">
                    <button className="vsc-action-btn" onClick={() => setWordWrap(w => !w)} title="Toggle Word Wrap">
                        <WrapText size={14} />
                        <span>{wordWrap ? 'Unwrap' : 'Wrap'}</span>
                    </button>
                    <button className="vsc-action-btn" onClick={handleCopy} title="Copy">
                        <Copy size={14} />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button className="vsc-action-btn" onClick={handleFormat} title="Format JSON (Shift+Alt+F)">
                        <span>Format</span>
                    </button>
                    <button
                        className={`vsc-save-btn ${error ? 'disabled' : ''}`}
                        onClick={handleSave}
                        title="Save (Ctrl+S)"
                        disabled={!!error}
                    >
                        <Save size={13} />
                        <span>Save</span>
                    </button>
                </div>
            </div>

            {/* Editor body */}
            <div className="vsc-body">
                {/* Line numbers gutter */}
                <div className="vsc-gutter" ref={gutterRef}>
                    {lines.map(n => (
                        <div key={n} className="vsc-line-num">{n}</div>
                    ))}
                </div>

                {/* Scrollable editor pane */}
                <div
                    className="vsc-scroll-pane"
                    ref={scrollRef}
                    onScroll={syncScroll}
                >
                    {/* Syntax highlight layer (non-interactive) */}
                    <pre
                        className={`vsc-highlight-layer ${wordWrap ? 'wrap' : ''}`}
                        ref={highlightRef}
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
                    />

                    {/* Actual textarea (transparent, on top) */}
                    <textarea
                        ref={textareaRef}
                        className={`vsc-textarea ${wordWrap ? 'wrap' : ''}`}
                        value={code}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoComplete="off"
                        data-gramm="false"
                    />
                </div>
            </div>

            {/* Status bar */}
            <div className={`vsc-statusbar ${error ? 'has-error' : saved ? 'has-success' : ''}`}>
                <div className="vsc-status-left">
                    {error ? (
                        <>
                            <AlertCircle size={12} />
                            <span>JSON Error: {error}</span>
                        </>
                    ) : saved ? (
                        <>
                            <CheckCircle2 size={12} />
                            <span>Saved &amp; synced</span>
                        </>
                    ) : (
                        <span className="vsc-hint">Ctrl+S to save · Tab to indent</span>
                    )}
                </div>
                <div className="vsc-status-right">
                    <span>{lineCount} lines</span>
                    <span>JSON</span>
                    <span>UTF-8</span>
                </div>
            </div>
        </div>
    );
}
