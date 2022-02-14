import { Highlighter } from './highlighter.js';
import { History, HistoryError } from './history.js';

export { Highlighter };

/**
 * @class Editor implements the whole editor logic.
 */
export class Editor {
    /**
     * @constructor Constructs an editor from given customization.
     * 
     * @param {object} params an object in the following format:
     *                        {
     *                            // Optional if running in a browser
     *                            document: Document,
     *                            // Element where the user writes code into. 
     *                            targetTextArea: HTMLTextAreaElement,
     *                            // Element where code is displayed highlighted.
     *                            targetTextPre: HTMLPreElement,
     *                            // Element where line number is displayed.
     *                            currLineSpan: HTMLSpanElement,
     *                            // Element where column number is displayed.
     *                            currColumnSpan: HTMLSpanElement,
     *                            // Highlighter created with desired rules.
     *                            highlighter: Highlighter,
     *                            // A function that saves source code in some
     *                            // storage.
     *                            saveCode: function(string) -> (),
     *                            // A function that loads source code from some
     *                            // storage.
     *                            loadCode: function() -> string,
     *                            // A function that saves history data in some
     *                            // storage.
     *                            saveCodeHist: function(object) -> (),
     *                            // A function that loads history data from
     *                            // some storage.
     *                            loadCodeHist: function() -> object
     *                                              throws SyntaxError,
     *                            // A function that handles key events for
     *                            // custom behaviour.
     *                            handleKey: function(Editor, KeyboardEvent)
     *                                          -> (),
     *                            // History limit. Optional, default 5000.
     *                            historyLimit: number.
     *                        }
     */
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

    /**
     * @private for this class.
     * 
     * @method refreshPrevState refreshes previous cached state of input.
     */
    refreshPrevState() {
        this.prevState.selectionStart = this.targetTextArea.selectionStart;
        this.prevState.selectionEnd = this.targetTextArea.selectionEnd;
        this.prevState.content = this.targetTextArea.value;
    }

    /**
     * @private for this class.
     * 
     * @method updateContent updates input content and refershes interal state.
     * 
     * @param {string} content new content.
     */
    updateContent(content) {
        this.targetTextArea.value = content;
        this.refreshContent();
    }

    /**
     * @returns The user input contents.
     */
    get content() {
        return this.targetTextArea.value;
    }

    /**
     * @private to this class
     * 
     * @method redo Redoes the current undone action, if any.
     */
    redo() {
        this.history.redo(this.targetTextArea);
        this.refreshContent();
    }

    /**
     * @private to this class
     * 
     * @method redo Undoes an the previous action in history, if any.
     */
    undo() {
        this.history.undo(this.targetTextArea);
        this.refreshContent();
    }

    /**
     * @private to this class
     * 
     * @method addToHistory adds an action to code history.
     * 
     * @param {object} action action in the source code in the format:
     *                        { start:number, oldText:string, newText:string }
     */
    addToHistory(action) {
        this.history.add(action);
        this.saveHistory();
    }


    /**
     * @private to this class
     * 
     * @method apply applies an action to the source code.
     * 
     * @param {object} action action in the source code in the format:
     *                        { start:number, oldText:string, newText:string }
     */
    apply(action) {
        this.history.apply(action, this.targetTextArea);
    }

    /**
     * @private to this class
     * 
     * @method apply applies an action to the source code in reverse:
     *                  oldText becomes newText and vice-versa.
     * 
     * @param {object} action action in the source code in the format:
     *                        { start:number, oldText:string, newText:string }
     */
    applyRev(action) {
        this.history.applyRev(action, this.targetTextArea);
    }

    /**
     * @private to this class
     * 
     * @method edit Edits currently selected text (even if empty).
     * 
     * @param {string} newText text replacing selected text.
     */
    edit(newText) {
        const start = this.targetTextArea.selectionStart;
        const end = this.targetTextArea.selectionEnd;
        const oldText = this.targetTextArea.value.substring(start, end);
        const action = { start, oldText, newText };

        this.apply(action);
        this.addToHistory(action);
        this.refreshContent();
    }

    /**
     * @private to this class
     * 
     * @method load Loads code and its history from load functions. If history
     *              data is invalid, it is resetted.
     */
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

    /**
     * @private to this class
     * 
     * @method resetHistory resets history and then saves it.
     */
    resetHistory() {
        this.history.reset();
        this.saveHistory();
    }

    /**
     * @private to this class
     * 
     * @method saveContent saves the code content using save function.
     */
    saveContent() {
        this.saveCode(this.targetTextArea.value);
    }

    /**
     * @private to this class
     * 
     * @method saveHistory saves code history using save function.
     */
    saveHistory() {
        this.saveCodeHist(this.history.export());
    }

    /**
     * @private to this class
     * 
     * @method highlight highlights source code.
     */
    highlight() {
        this.highlighter.highlight(
            this.targetTextArea,
            this.targetPre,
            this.document
        );
    }

    /**
     * @private to this class
     * 
     * @method syncScroll synchronizes display'scroll with input's scroll.
     */
    syncScroll() {
        this.targetPre.scrollTop = this.targetTextArea.scrollTop;
    }

    /**
     * @private to this class
     * 
     * @method refreshPosition refreshes state affected by position change.
     */
    refreshPosition() {
        this.syncScroll();
        this.updateLineColumn();
    }

    /**
     * @private to this class
     * 
     * @method refreshContent refreshes state affected by any content change.
     */
    refreshContent() {
        this.refreshPrevState();
        this.highlight();
        this.refreshPosition();
        this.saveContent();
    }

    /**
     * @private to this class
     * 
     * @method updateLineColumn updates display of line and column numbers.
     */
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

    /**
     * @private to this class
     * 
     * @returns whether the cursor is between '{}'.
     */
    isBetweenCurlies() {
        const start = this.targetTextArea.selectionStart;
        return (
            start > 0
            && this.targetTextArea.value[start - 1] == '{'
            && this.targetTextArea.value[start] == '}'
        );
    }

    /**
     * @private to this class
     * 
     * @returns whether the cursor is between '[]'.
     */
    isBetweenSquares() {
        const start = this.targetTextArea.selectionStart;
        return (
            start > 0
            && this.targetTextArea.value[start - 1] == '['
            && this.targetTextArea.value[start] == ']'
        );
    }

    /**
     * @private to this class
     * 
     * @returns whether the cursor is between '()'.
     */
    isBetweenParens() {
        const start = this.targetTextArea.selectionStart;
        return (
            start > 0
            && this.targetTextArea.value[start - 1] == '('
            && this.targetTextArea.value[start] == ')'
        );
    }

    /********** EVENT HANDLERS **********/

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
