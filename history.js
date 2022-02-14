/**
 * @class HistoryError is used to differentiate JS errors from errors occuring
 *                      because of an attempt to load an invalid history.
 * @private to the library.
 */
export class HistoryError extends Error {
    /**
     * Constructs a history error simply using a message as data.
     * 
     * @param {string} msg Error message
     */
    constructor(msg) {
        super(msg);
    }
}

/**
 * @class History is a class that implements an editor's history logic, while
 *                  decoupling history from the editor as a whole, e.g. by
 *                  not managing DOM elements as internal state, but rather
 *                  requiring them as parameters only where necessary.
 * @private to the library.
 */
export class History {
    /**
     * @constructor Creates an empty history.
     * 
     * @param {number} limit Limit of this history, such that, when history has
     *                          too many entries, initial entries are
     *                          chopped-off in order to satisfy this limit.
     */
    constructor(limit) {
        this.cursor = 0;
        this.entries = [];
        this.limit = limit || 5000;
    }

    /**
     * @method redo Undoes a previously done action on the source code, if
     *              the cursor is not at the beginning of history.
     * 
     * @param {HTMLTextAreaElement} target The element whose text will be
     *                                      modified.
     */
    undo(target) {
        if (this.cursor > 0) {
            this.cursor--;
            this.applyRev(this.entries[this.cursor], target);
        }
    }

    /**
     * @method redo Redoes a previously undone action on the source code, if
     *              there is such action available.
     * 
     * @param {HTMLTextAreaElement} target The element whose text will be
     *                                      modified.
     */
    redo(target) {
        if (this.cursor < this.entries.length) {
            this.apply(this.entries[this.cursor], target);
            this.cursor++;
        }
    }

    /**
     * @method import Imports an external object as history. The use-case is for
     *                  passing a  deserialized object.
     * 
     * @param {object} data The object containing external history data. Must
     *                      containg a number field called 'cursor', and an
     *                      array field called entries. Each of the entries must
     *                      contain a number field called 'start', a string
     *                      field called 'oldText' and another string field
     *                      called 'newText'. 'cursor' must not be greater than
     *                      the number of entries, and must not be negative.
     */
    import(data) {
        if (typeof data != 'object' || data == null) {
            throw new HistoryError('Data is not a valid object');
        }
        if (typeof data.cursor != 'number') {
            throw new HistoryError('Data cursor is not a number');
        }
        if (!(data.entries instanceof Array)) {
            throw new HistoryError('Data entries are not an Array');
        }
        for (const entry of data.entries) {
            if (typeof entry != 'object' || entry == null) {
                throw new HistoryError('An entry is not a valid object');
            }
            if (typeof entry.start != 'number') {
                throw new HistoryError('An entry start is not a number');
            }
            if (typeof entry.oldText != 'string') {
                throw new HistoryError('An entry oldText is not string');
            }
            if (typeof entry.newText != 'string') {
                throw new HistoryError('An entry newText is not string');
            }
        }
        if (data.cursor < 0 || data.cursor > data.entries.length) {
            throw new HistoryError('Cursor is too far');
        }
        this.cursor = data.cursor | 0;
        this.entries = data.entries.map(action => Object.assign({}, action));
    }

    /**
     * @method export Exports history as a plain JS object, with intention of
     *                  being serialized.
     * 
     * @returns a JavaScript object with exported data for serialization.
     */
    export() {
        return { cursor: this.cursor, entries: this.entries };
    }

    /**
     * @method reset Clears history, making it empty again.
     */
    reset() {
        this.cursor = 0;
        this.entries = [];
    }

    /**
     * @method add Adds an action to history. If the cursor is not at the end,
     *              undone actions are deleted.
     * 
     * @param {object} action In the format {
     *                                          start: int,
     *                                          oldText: string,
     *                                          newText: string,
     *                                       }
     */
    add(action) {
        this.entries.splice(this.cursor);
        this.entries.push(action);
        this.cursor++;
        if (this.entries.length >= this.limit) {
            const newStart = this.entries.length - this.limit;
            this.entries.splice(0, newStart);
            this.cursor -= newStart;
        }
    }

    /**
     * @method apply Applies an action to source code.
     * @param {object} action In the format {
     *                                          start: int,
     *                                          oldText: string,
     *                                          newText: string,
     *                                       }
     * @param {HTMLTextAreaElement} target The element whose text will be
     *                                      modified.
     */
    apply(action, target) {
        const end = action.start + action.oldText.length;
        const prev = target.value.substring(0, action.start);
        const next = target.value.substring(end);
        target.value = prev + action.newText + next;

        const newPosition = action.start + action.newText.length;
        target.selectionStart = newPosition;
        target.selectionEnd = newPosition;
    }

    /**
     * @method apply Applies an action to source code in reverse. This means
     *                  that the old text is interpreted as new text, and
     *                  vice-versa.
     * @param {object} action In the format {
     *                                          start: int,
     *                                          oldText: string,
     *                                          newText: string,
     *                                       }
     * @param {HTMLTextAreaElement} target The element whose text will be
     *                                      modified.
     */
    applyRev(action, target) {
        const end = action.start + action.newText.length;
        const prev = target.value.substring(0, action.start);
        const next = target.value.substring(end);
        target.value = prev + action.oldText + next;

        const newPosition = action.start + action.oldText.length;
        target.selectionStart = newPosition;
        target.selectionEnd = newPosition;
    }
}
