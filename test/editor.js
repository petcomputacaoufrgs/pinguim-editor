import * as assert from 'assert';
import { JSDOM } from 'jsdom';
import { Editor, Highlighter } from '../index.js';

describe('Editor', function () {
    describe('#edit()', function () {
        it('insert text', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 2);

            editor.edit(' cond');
            assert.equal(editor.content, 'if cond then a else b');
            assert.equal(params.targetTextArea.selectionStart, 7);
            assert.equal(params.targetTextArea.selectionEnd, 7);
            assert.equal(params.loadCode(), 'if cond then a else b');
        });

        it('delete text', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 8, 10);

            editor.edit('');
            assert.equal(editor.content, 'if then else b');
            assert.equal(params.targetTextArea.selectionStart, 8);
            assert.equal(params.targetTextArea.selectionEnd, 8);
            assert.equal(params.loadCode(), 'if then else b');
        });

        it('replace text', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 8, 9);

            editor.edit('banana');
            assert.equal(editor.content, 'if then banana else b');
            assert.equal(params.targetTextArea.selectionStart, 14);
            assert.equal(params.targetTextArea.selectionEnd, 14);
            assert.equal(params.loadCode(), 'if then banana else b');
        });

        it('edit higlights', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);

            editor.edit('banana');
            assert.equal(editor.content, 'bananaif then a else b');
            assert.equal(params.targetTextArea.selectionStart, 6);
            assert.equal(params.targetTextArea.selectionEnd, 6);
            assert.equal(params.loadCode(), 'bananaif then a else b');

            const TextType = params.window.Text;
            assert.ok(params.targetPre.childNodes[0] instanceof TextType);
            assert.equal(
                params.targetPre.childNodes[0].textContent,
                'bananaif '
            );
        });
    });

    describe('#updateLineColumn', function () {
        it('updates after move', function () {

            const params = makeEditorParams();
            const editor = new Editor(params);

            editor.edit('foo\nbar');

            assert.equal(params.currLineSpan.textContent, '2');
            assert.equal(params.currColumnSpan.textContent, '4');
        });
    });

    describe('#syncScrolls()', function () {
        it('sync after desync', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);

            params.targetTextArea.scrollTop = 0;
            params.targetPre.scrollTop = 5;

            editor.edit('banana');
            assert.equal(editor.content, 'bananaif then a else b');
            assert.equal(params.targetTextArea.selectionStart, 6);
            assert.equal(params.targetTextArea.selectionEnd, 6);
            assert.equal(params.loadCode(), 'bananaif then a else b');
            assert.equal(params.targetTextArea.scrollTop, 0);
            assert.equal(params.targetPre.scrollTop, 0);
        });
    });

    describe('#eventHandlers', function () {
        it('input event inserting without selection', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 2);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'c',
                code: 'KeyC',
                content: 'c',
            });

            setImmediate(() => {
                assert.equal(editor.content, 'ifc then a else b');
                assert.equal(params.targetTextArea.selectionStart, 3);
                assert.equal(params.targetTextArea.selectionEnd, 3);
                assert.equal(params.loadCode(), 'ifc then a else b');
            });
        });

        it('input event inserting with selection', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 5);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'c',
                code: 'KeyC',
                content: 'c',
            });

            setImmediate(() => {
                assert.equal(editor.content, 'ifcen a else b');
                assert.equal(params.targetTextArea.selectionStart, 3);
                assert.equal(params.targetTextArea.selectionEnd, 3);
                assert.equal(params.loadCode(), 'ifcen a else b');
            });
        });

        it('input event using BACKSPACE without selection', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 4, 4);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'Backspace',
                code: 'Backspace',
                content: undefined,
            });

            setImmediate(() => {
                assert.equal(editor.content, 'if hen a else b');
                assert.equal(params.targetTextArea.selectionStart, 3);
                assert.equal(params.targetTextArea.selectionEnd, 3);
                assert.equal(params.loadCode(), 'if hen a else b');
            });
        });

        it('input event using BACKSPACE with selection', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 4, 6);


            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'Backspace',
                code: 'Backspace',
                content: undefined,
            });

            setImmediate(() => {
                assert.equal(editor.content, 'if tn a else b');
                assert.equal(params.targetTextArea.selectionStart, 4);
                assert.equal(params.targetTextArea.selectionEnd, 4);
                assert.equal(params.loadCode(), 'if tn a else b');
            });
        });

        it('input event using DELETE without selection', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 4, 4);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'Delete',
                code: 'Delete',
                content: undefined,
            });

            setImmediate(() => {
                assert.equal(editor.content, 'if ten a else b');
                assert.equal(params.targetTextArea.selectionStart, 4);
                assert.equal(params.targetTextArea.selectionEnd, 4);
                assert.equal(params.loadCode(), 'if ten a else b');
            });
        });

        it('input event using DELETE with selection', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 4, 6);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'Delete',
                code: 'Delete',
                content: undefined,
            });

            setImmediate(() => {
                assert.equal(editor.content, 'if tn a else b');
                assert.equal(params.targetTextArea.selectionStart, 4);
                assert.equal(params.targetTextArea.selectionEnd, 4);
                assert.equal(params.loadCode(), 'if tn a else b');
            });
        });

        it('insert parenthesis', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 2);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: '(',
                code: 'Digit9',
                content: '(',
                prevented: true,
            });

            setImmediate(() => {
                assert.equal(editor.content, 'if() then a else b');
                assert.equal(params.targetTextArea.selectionStart, 3);
                assert.equal(params.targetTextArea.selectionEnd, 3);
                assert.equal(params.loadCode(), 'if() then a else b');
            });
        });

        it('insert square brackets', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 2);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: '[',
                code: 'Backslash',
                content: '[',
                prevented: true,
            });

            setImmediate(() => {
                assert.equal(editor.content, 'if[] then a else b');
                assert.equal(params.targetTextArea.selectionStart, 3);
                assert.equal(params.targetTextArea.selectionEnd, 3);
                assert.equal(params.loadCode(), 'if[] then a else b');
            });
        });

        it('insert curly brackets', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 2);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: '{',
                code: 'BacketRight',
                content: '{',
                prevented: true,
            });

            setImmediate(() => {
                assert.equal(editor.content, 'if{} then a else b');
                assert.equal(params.targetTextArea.selectionStart, 3);
                assert.equal(params.targetTextArea.selectionEnd, 3);
                assert.equal(params.loadCode(), 'if{} then a else b');
            });
        });

        it('events with undo', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 5);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'c',
                code: 'KeyC',
                content: 'c',
            });

            setImmediate(() => {
                assert.equal(editor.content, 'ifcen a else b');
                assert.equal(params.targetTextArea.selectionStart, 3);
                assert.equal(params.targetTextArea.selectionEnd, 3);
                assert.equal(params.loadCode(), 'ifcen a else b');
                editor.undo();
                assert.equal(editor.content, 'if then a else b');
                assert.equal(params.targetTextArea.selectionStart, 5);
                assert.equal(params.targetTextArea.selectionEnd, 5);
                assert.equal(params.loadCode(), 'if then a else b');
            });
        });

        it('events with redo', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 5);

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'c',
                code: 'KeyC',
                content: 'c',
            });

            simulateKeyOnTextArea(params.window, params.targetTextArea, {
                key: 'd',
                code: 'KeyD',
                content: 'd',
            });

            setImmediate(() => {
                assert.equal(editor.content, 'ifcden a else b');
                assert.equal(params.targetTextArea.selectionStart, 4);
                assert.equal(params.targetTextArea.selectionEnd, 4);
                assert.equal(params.loadCode(), 'ifcden a else b');
                editor.undo();
                editor.undo();
                editor.redo();
                assert.equal(editor.content, 'ifcen a else b');
                assert.equal(params.targetTextArea.selectionStart, 3);
                assert.equal(params.targetTextArea.selectionEnd, 3);
                assert.equal(params.loadCode(), 'ifcen a else b');
            });
        });

        it('delete parenthesis', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 2);
            setImmediate(() => {
                editor.edit('()');
                changeSelection(params.window, params.targetTextArea, 3, 3);

                simulateKeyOnTextArea(params.window, params.targetTextArea, {
                    key: 'Backspace',
                    code: 'Backspace',
                    content: undefined,
                    prevented: true,
                });

                setImmediate(() => {
                    assert.equal(editor.content, 'if then a else b');
                    assert.equal(params.targetTextArea.selectionStart, 2);
                    assert.equal(params.targetTextArea.selectionEnd, 2);
                    assert.equal(params.loadCode(), 'if then a else b');
                });
            });
        });

        it('delete square brackets', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 2);
            setImmediate(() => {
                editor.edit('[]');
                changeSelection(params.window, params.targetTextArea, 3, 3);

                simulateKeyOnTextArea(params.window, params.targetTextArea, {
                    key: 'Backspace',
                    code: 'Backspace',
                    content: undefined,
                    prevented: true,
                });

                setImmediate(() => {
                    assert.equal(editor.content, 'if then a else b');
                    assert.equal(params.targetTextArea.selectionStart, 2);
                    assert.equal(params.targetTextArea.selectionEnd, 2);
                    assert.equal(params.loadCode(), 'if then a else b');
                });
            });
        });

        it('delete curly brackets', function () {
            const params = makeEditorParams();
            const editor = new Editor(params);
            changeSelection(params.window, params.targetTextArea, 2, 2);
            setImmediate(() => {
                editor.edit('{}');
                changeSelection(params.window, params.targetTextArea, 3, 3);

                simulateKeyOnTextArea(params.window, params.targetTextArea, {
                    key: 'Backspace',
                    code: 'Backspace',
                    content: undefined,
                    prevented: true,
                });

                setImmediate(() => {
                    assert.equal(editor.content, 'if then a else b');
                    assert.equal(params.targetTextArea.selectionStart, 2);
                    assert.equal(params.targetTextArea.selectionEnd, 2);
                    assert.equal(params.loadCode(), 'if then a else b');
                });
            });
        });
    });

    function makeEditorParams() {
        const dom = new JSDOM(
            '<!DOCTYPE html>'
            + '<textarea id="back">if then a else b</textarea>'
            + '<pre id="front"></pre>'
            + '<span id="line-span"></span>'
            + '<span id="column-span"></span>'
        );
        const back = dom.window.document.getElementById('back');
        const front = dom.window.document.getElementById('front');
        const lineSpan = dom.window.document.getElementById('line-span');
        const columnSpan = dom.window.document.getElementById('column-span');

        const storage = {};

        return {
            window: dom.window,
            document: dom.window.document,
            targetTextArea: back,
            targetPre: front,
            currLineSpan: lineSpan,
            currColumnSpan: columnSpan,
            highlighter: new Highlighter(
                {
                    regex: /\bif\b|\bthen\b|\belse\b/,
                    className: 'keyword',
                },
            ),
            saveCode: code => {
                storage.code = code;
            },
            loadCode: () => {
                return storage.code;
            },
            saveCodeHist: history => {
                storage.history = history;
            },
            loadCodeHist: () => {
                return storage.history;
            },
        };
    }

    function dispatchSelectionEvent(window, element) {
        element.dispatchEvent(new window.Event('selectionchange', {
            bubbles: true,
            cancelable: true,
        }));
    }

    function changeSelection(window, element, newStart, newEnd) {
        element.selectionStart = newStart;
        element.selectionEnd = newEnd;
        dispatchSelectionEvent(window, element);
    }

    function simulateKeyOnTextArea(window, element, keyData) {
        const keyEvtData = {
            key: keyData.key,
            code: keyData.code,
            ctrlKey: keyData.ctrlKey || false,
            cmdKey: keyData.ctrlKey || false,
            altKey: keyData.altKey || false,
            metaKey: keyData.altKey || false,
            isComposing: true,
            cancelabe: true,
        };

        let inputType = null;
        let data = null;
        if (!keyEvtData.ctrlKey && !keyEvtData.altKey) {
            switch (keyData.key) {
                case 'Backspace':
                    inputType = 'deleteContentBackward';
                    break;
                case 'Delete':
                    inputType = 'deleteContentForward';
                    break;
                case 'Enter':
                    inputType = 'insertLineBreak';
                    break;
                default:
                    if (keyData.key.length == 1) {
                        inputType = 'insertText';
                        data = keyData.content;
                    }
                    break;
            }
        }

        const compStartEvent = new window.CompositionEvent('compositionstart');
        const compEndEvent = new window.CompositionEvent('compositionend');

        let beforeInputEvent = null;
        let inputEvent = null;
        if (inputType != null) {
            beforeInputEvent = new window.InputEvent('beforeinput', {
                inputType,
                data,
                isComposing: true,
                cancelabe: true,
            });
            inputEvent = new window.InputEvent('input', {
                inputType,
                data,
                isComposing: true,
                cancelabe: true,
            });
        }

        const keyDownEvent = new window.KeyboardEvent('keydown', keyEvtData);
        const keyUpEvent = new window.KeyboardEvent('keyup', keyEvtData);

        let selectionChanged = false;

        const afterInputListener = () => {
            if (selectionChanged) {
                dispatchSelectionEvent(window, element);
                element.removeEventListener('input', afterInputListener);
            }
        };

        const beforeInputListener = () => {
            switch (inputType) {
                case 'insertLineBreak':
                case 'insertText': {
                    const start = element.selectionStart;
                    const end = element.selectionEnd;
                    const pre = element.value.substring(0, start);
                    const post = element.value.substring(end);
                    element.value = pre + keyData.content + post;

                    const cursor = start + keyData.content.length
                    element.selectionStart = cursor;
                    element.selectionEnd = cursor;
                    selectionChanged = true;
                    break;
                }
                case 'deleteContentBackward': {
                    let start = element.selectionStart;
                    const end = element.selectionEnd;
                    if (start > 0 && start == end) {
                        start = start - 1;
                    }
                    const pre = element.value.substring(0, start);
                    const post = element.value.substring(end);
                    element.value = pre + post;
                    element.selectionStart = start;
                    element.selectionEnd = start;
                    selectionChanged = true;
                    break;
                }
                case 'deleteContentForward': {
                    const start = element.selectionStart;
                    let end = element.selectionEnd;
                    if (end < element.value.length && start == end) {
                        end = end + 1;
                    }
                    const pre = element.value.substring(0, start);
                    const post = element.value.substring(end);
                    element.value = pre + post;
                    element.selectionStart = start;
                    element.selectionEnd = start;
                    selectionChanged = true;
                    break;
                }
            }

            element.removeEventListener('beforeinput', beforeInputListener);
        };

        if (!keyData.prevented) {
            element.addEventListener('beforeinput', beforeInputListener);
            element.addEventListener('input', afterInputListener);
        }

        element.dispatchEvent(compStartEvent);
        element.dispatchEvent(keyDownEvent);
        if (beforeInputEvent != null) {
            element.dispatchEvent(beforeInputEvent);
        }
        if (inputEvent != null) {
            element.dispatchEvent(inputEvent);
        }
        element.dispatchEvent(keyUpEvent);
        element.dispatchEvent(compEndEvent);
    }
});
