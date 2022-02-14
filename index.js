import { Highlighter } from './highlighter.js';
import { History, HistoryError } from './history.js';

export { Highlighter };

export class Editor {
    constructor(params) {
        this.document = params.document || document;
        this.targetTextArea = params.targetTextArea;
        this.targetPre = params.targetPre;
        this.currLineSpan = params.currLineSpan;
        this.currColumnSpan = params.currColumnSpan;
        this.highlighter = params.highlighter;
        this.saveCode = params.saveCode;
        this.loadCode = params.loadCode;
        this.saveCodeHist = params.saveCodeHist;
        this.loadCodeHist = params.loadCodeHist;
        this.externalHandleKey = params.handleKey || (() => { });
        this.prevState = { selectionStart: 0, selectionEnd: 0, content: '' };
        this.history = new History(params.historyLimit);

        this.refreshPrevState();

        this.targetTextArea.addEventListener('selectionchange', evt => {
            this.refreshContent();
        });

        this.targetTextArea.addEventListener('keydown', evt => {
            this.handleKey(evt);
        });

        this.targetTextArea.addEventListener('scroll', evt => {
            this.refreshPosition();
        });

        this.targetTextArea.addEventListener('input', evt => {
            this.handleUserEdit(evt);
        });

        this.targetTextArea.addEventListener('click', evt => {
            this.refreshContent();
        });
    }

    refreshPrevState() {
        this.prevState.selectionStart = this.targetTextArea.selectionStart;
        this.prevState.selectionEnd = this.targetTextArea.selectionEnd;
        this.prevState.content = this.targetTextArea.value;
    }

    updateContent(content) {
        this.targetTextArea.value = content;
        this.refreshContent();
    }

    get content() {
        return this.targetTextArea.value;
    }

    redo() {
        this.history.redo(this.targetTextArea);
        this.refreshContent();
    }

    undo() {
        this.history.undo(this.targetTextArea);
        this.refreshContent();
    }

    addToHistory(action) {
        this.history.add(action);
        this.saveHistory();
    }

    apply(action) {
        this.history.apply(action, this.targetTextArea);
    }

    applyRev(action) {
        this.history.applyRev(action, this.targetTextArea);
    }

    edit(newText) {
        const start = this.targetTextArea.selectionStart;
        const end = this.targetTextArea.selectionEnd;
        const oldText = this.targetTextArea.value.substring(start, end);
        const action = { start, oldText, newText };

        this.apply(action);
        this.addToHistory(action);
        this.refreshContent();
    }

    load() {
        this.targetTextArea.value = this.loadCode() || '';
        try {
            this.history.import(this.loadCodeHist());
        } catch (error) {
            if (error instanceof SyntaxError || error instanceof HistoryError) {
                this.resetHistory();
            } else {
                throw error;
            }
        }
        this.refreshContent();
    }

    resetHistory() {
        this.history.reset();
        this.saveHistory();
    }

    saveContent() {
        this.saveCode(this.targetTextArea.value);
    }

    saveHistory() {
        this.saveCodeHist(this.history.export());
    }

    highlight() {
        this.highlighter.highlight(
            this.targetTextArea,
            this.targetPre,
            this.document
        );
    }

    syncScroll() {
        this.targetPre.scrollTop = this.targetTextArea.scrollTop;
    }

    refreshPosition() {
        this.syncScroll();
        this.updateLineColumn();
    }

    refreshContent() {
        this.refreshPrevState();
        this.highlight();
        this.refreshPosition();
        this.saveContent();
    }

    updateLineColumn() {
        const position = this.targetTextArea.selectionStart;
        const prevText = this.targetTextArea.value.substring(0, position);
        let line = 1;
        for (const ch of prevText) {
            if (ch == '\n') {
                line++;
            }
        }
        const lineStart = prevText.lastIndexOf('\n') + 1;
        const column = position - lineStart + 1;

        this.currLineSpan.textContent = line;
        this.currColumnSpan.textContent = column;
    }

    isBetweenCurlies() {
        const start = this.targetTextArea.selectionStart;
        return (
            start > 0
            && this.targetTextArea.value[start - 1] == '{'
            && this.targetTextArea.value[start] == '}'
        );
    }

    isBetweenSquares() {
        const start = this.targetTextArea.selectionStart;
        return (
            start > 0
            && this.targetTextArea.value[start - 1] == '['
            && this.targetTextArea.value[start] == ']'
        );
    }

    isBetweenParens() {
        const start = this.targetTextArea.selectionStart;
        return (
            start > 0
            && this.targetTextArea.value[start - 1] == '('
            && this.targetTextArea.value[start] == ')'
        );
    }

    handleUserEdit(evt) {
        evt.preventDefault();
        const start = (
            this.prevState.selectionStart > this.targetTextArea.selectionStart
                ? this.targetTextArea.selectionStart
                : this.prevState.selectionStart
        );
        const end = this.prevState.selectionEnd;
        const newEnd = this.targetTextArea.selectionEnd;
        const oldText = this.prevState.content.substring(start, end);
        const newText = this.targetTextArea.value.substring(start, newEnd);
        const action = { start, oldText, newText };

        this.addToHistory(action);
        this.refreshContent();
    }

    handleTab(evt) {
        evt.preventDefault();
        this.edit('    ');
    }

    handleBackspace(evt) {
        if (
            this.isBetweenCurlies()
            || this.isBetweenSquares()
            || this.isBetweenParens()
        ) {
            evt.preventDefault();
            this.targetTextArea.selectionStart--;
            this.targetTextArea.selectionEnd++;
            this.edit('');
        }
    }

    handleParens(evt) {
        evt.preventDefault();
        this.edit('()');
        this.targetTextArea.selectionStart--;
        this.targetTextArea.selectionEnd--;
    }

    handleSquare(evt) {
        evt.preventDefault();
        this.edit('[]');
        this.targetTextArea.selectionStart--;
        this.targetTextArea.selectionEnd--;
    }

    handleCurly(evt) {
        evt.preventDefault();
        this.edit('{}');
        this.targetTextArea.selectionStart--;
        this.targetTextArea.selectionEnd--;
    }

    handleCtrlZ(evt) {
        evt.preventDefault();
        this.undo();
    }

    handleCtrlShiftZ(evt) {
        evt.preventDefault();
        this.redo();
    }

    handleCtrlY(evt) {
        evt.preventDefault();
        this.redo();
    }

    handleKey(evt) {
        const singleKeyMap = {
            'Tab': evt => this.handleTab(evt),
            'Backspace': evt => this.handleBackspace(evt),
            '(': evt => this.handleParens(evt),
            '[': evt => this.handleSquare(evt),
            '{': evt => this.handleCurly(evt)
        };

        const ctrlKeyMap = {
            'z': evt => this.handleCtrlZ(evt),
            'y': evt => this.handleCtrlY(evt),
        };

        const ctrlShiftKeyMap = {
            'Z': evt => this.handleCtrlShiftZ(evt),
        };

        if (evt.ctrlKey || evt.cmdKey) {
            if (evt.shiftKey) {
                if (evt.key in ctrlShiftKeyMap) {
                    ctrlShiftKeyMap[evt.key](evt);
                }
            } else if (evt.key in ctrlKeyMap) {
                ctrlKeyMap[evt.key](evt);
            }
        } else if (evt.key in singleKeyMap) {
            singleKeyMap[evt.key](evt);
        }

        this.externalHandleKey(this, evt);
    }
}
