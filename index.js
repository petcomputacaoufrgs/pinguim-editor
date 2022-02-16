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
     *                            handleKey: function(KeyboardEvent, Editor)
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
        this.customHandleKey = params.handleKey || (() => { });
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
        this.prevState.selectionStart = this.selectionStart;
        this.prevState.selectionEnd = this.selectionEnd;
        this.prevState.content = this.content;
    }

    /**
     * @param {string} content new content.
     */
    set content(value) {
        this.targetTextArea.value = value;
        this.refreshContent();
    }

    /**
     * @returns The user input contents.
     */
    get content() {
        return this.targetTextArea.value;
    }

    /**
     * @returns The start position of user input contents' selection.
     */
    get selectionStart() {
        return this.targetTextArea.selectionStart;
    }

    /**
     * @returns The end position of user input contents' selection.
     */
    get selectionEnd() {
        return this.targetTextArea.selectionEnd;
    }

    /**
     * @param {number} value The new selection start.
     */
    set selectionStart(value) {
        this.changeSelection(value, this.selectionEnd);
    }

    /**
     * @param {number} value The new selection end.
     */
    set selectionEnd(value) {
        this.changeSelection(this.selectionStart, value);
    }

    /**
     * @method changeSelection Sets selection start and end, then refreshes
     *                          internal state.
     * 
     * @param {number} start The new selection start.
     * @param {number} end The new selection end.
     */
    changeSelection(start, end) {
        this.targetTextArea.selectionStart = start;
        this.targetTextArea.selectionEnd = end;
        this.refreshContent();
    }

    /**
     * @method redo Redoes the current undone action, if any.
     */
    redo() {
        this.history.redo(this.targetTextArea);
        this.refreshContent();
    }

    /**
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
     * @method apply applies an action to the source code.
     * 
     * @param {object} action action in the source code in the format:
     *                        { start:number, oldText:string, newText:string }
     */
    apply(action) {
        this.history.apply(action, this.targetTextArea);
        this.refreshContent();
    }

    /**
     * @method apply applies an action to the source code in reverse:
     *                  oldText becomes newText and vice-versa.
     * 
     * @param {object} action action in the source code in the format:
     *                        { start:number, oldText:string, newText:string }
     */
    applyRev(action) {
        this.history.applyRev(action, this.targetTextArea);
        this.refreshContent();
    }

    /**
     * @method edit Edits currently selected text (even if empty).
     * 
     * @param {string} newText text replacing selected text.
     */
    edit(newText) {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const oldText = this.content.substring(start, end);
        const action = { start, oldText, newText };

        this.addToHistory(action);
        this.apply(action);
    }

    /**
     * @method load Loads code and its history from load functions. If history
     *              data is invalid, it is resetted.
     */
    load() {
        try {
            this.history.import(this.loadCodeHist());
        } catch (error) {
            if (error instanceof SyntaxError || error instanceof HistoryError) {
                this.resetHistory();
            } else {
                throw error;
            }
        }
        this.content = this.loadCode() || '';
    }

    /**
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
        this.saveCode(this.content);
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
        const position = this.selectionStart;
        const prevText = this.content.substring(0, position);
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
     * @returns whether the cursor is between '{}'.
     */
    isBetweenCurlies() {
        const start = this.selectionStart;
        return (
            start > 0
            && this.content[start - 1] == '{'
            && this.content[start] == '}'
        );
    }

    /**
     * @returns whether the cursor is between '[]'.
     */
    isBetweenSquares() {
        const start = this.selectionStart;
        return (
            start > 0
            && this.content[start - 1] == '['
            && this.content[start] == ']'
        );
    }

    /**
     * @returns whether the cursor is between '()'.
     */
    isBetweenParens() {
        const start = this.selectionStart;
        return (
            start > 0
            && this.content[start - 1] == '('
            && this.content[start] == ')'
        );
    }

    /********** EVENT HANDLERS **********/
    /************* PRIVATE *************/

    handleUserEdit(evt) {
        evt.preventDefault();
        const start = (
            this.prevState.selectionStart > this.selectionStart
                ? this.selectionStart
                : this.prevState.selectionStart
        );
        const end = this.prevState.selectionEnd;
        const newEnd = this.selectionEnd;
        const oldText = this.prevState.content.substring(start, end);
        const newText = this.content.substring(start, newEnd);
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
            this.selectionStart--;
            this.selectionEnd++;
            this.edit('');
        }
    }

    handleParens(evt) {
        evt.preventDefault();
        this.edit('()');
        this.selectionStart--;
        this.selectionEnd--;
    }

    handleSquare(evt) {
        evt.preventDefault();
        this.edit('[]');
        this.selectionStart--;
        this.selectionEnd--;
    }

    handleCurly(evt) {
        evt.preventDefault();
        this.edit('{}');
        this.selectionStart--;
        this.selectionEnd--;
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

        this.customHandleKey(evt, this);
    }
}
