import * as assert from 'assert';
import { JSDOM } from 'jsdom';
import { History } from '../history.js';

describe('History', function () {
    function getElement() {
        const dom = new JSDOM(
            '<!DOCTYPE html>'
            + '<textarea id="target">let id = \\x.x in id id</textarea>'
        );
        return dom.window.document.getElementById('target');
    }

    describe('#export()', function () {
        it('export a few items with cursor at the end', function () {
            const history = new History();
            history.add({ start: 4, oldText: '', newText: 'id' });
            history.add({ start: 13, oldText: ';', newText: '' });
            history.add({ start: 10, oldText: 'y', newText: 'x' });
            assert.deepEqual(
                history.export(),
                {
                    cursor: 3,
                    entries: [
                        { start: 4, oldText: '', newText: 'id' },
                        { start: 13, oldText: ';', newText: '' },
                        { start: 10, oldText: 'y', newText: 'x' },
                    ],
                }
            );
        });

        it('export a few items with cursor at middle', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 4, oldText: '', newText: 'id' });
            history.add({ start: 13, oldText: ';', newText: '' });
            history.add({ start: 10, oldText: 'y', newText: 'x' });
            history.undo(target);
            assert.deepEqual(
                history.export(),
                {
                    cursor: 2,
                    entries: [
                        { start: 4, oldText: '', newText: 'id' },
                        { start: 13, oldText: ';', newText: '' },
                        { start: 10, oldText: 'y', newText: 'x' },
                    ],
                }
            );
        });

        it('export nothing', function () {
            const history = new History();
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] },
            );
        });
    });

    describe('#import()', function () {
        it('import a few entries and re-export must match', function () {
            const history = new History();
            history.import({
                cursor: 3,
                entries: [
                    { start: 4, oldText: '', newText: 'id' },
                    { start: 13, oldText: ';', newText: '' },
                    { start: 10, oldText: 'y', newText: 'x' },
                ],
            });
            assert.deepEqual(
                history.export(),
                {
                    cursor: 3,
                    entries: [
                        { start: 4, oldText: '', newText: 'id' },
                        { start: 13, oldText: ';', newText: '' },
                        { start: 10, oldText: 'y', newText: 'x' },
                    ],
                }
            );
        });

        it('import with cursor at middle, re-export must match', function () {
            const history = new History();
            history.import({
                cursor: 2,
                entries: [
                    { start: 4, oldText: '', newText: 'id' },
                    { start: 13, oldText: ';', newText: '' },
                    { start: 10, oldText: 'y', newText: 'x' },
                ],
            });
            assert.deepEqual(
                history.export(),
                {
                    cursor: 2,
                    entries: [
                        { start: 4, oldText: '', newText: 'id' },
                        { start: 13, oldText: ';', newText: '' },
                        { start: 10, oldText: 'y', newText: 'x' },
                    ],
                }
            );
        });

        it('import nothing and re-export must match', function () {
            const history = new History();
            history.import({ cursor: 0, entries: [] });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });

        it('cursor out of bounds', function () {
            const history = new History();
            assert.throws(function () {
                history.import({
                    cursor: 4,
                    entries: [
                        { start: 4, oldText: '', newText: 'id' },
                        { start: 13, oldText: ';', newText: '' },
                        { start: 10, oldText: 'y', newText: 'x' },
                    ],
                })
            });
            assert.throws(function () {
                history.import({
                    cursor: -1,
                    entries: [
                        { start: 4, oldText: '', newText: 'id' },
                        { start: 13, oldText: ';', newText: '' },
                        { start: 10, oldText: 'y', newText: 'x' },
                    ],
                })
            });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });

        it('invalid start type', function () {
            const history = new History();
            assert.throws(function () {
                history.import({
                    cursor: 4,
                    entries: [
                        { start: 4, oldText: '', newText: 'id' },
                        { start: '13', oldText: ';', newText: '' },
                        { start: 10, oldText: 'y', newText: 'x' },
                    ],
                })
            });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });

        it('invalid entry type', function () {
            const history = new History();
            assert.throws(function () {
                history.import({
                    cursor: 4,
                    entries: ['a'],
                })
            });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });

        it('invalid entries type', function () {
            const history = new History();
            assert.throws(function () {
                history.import({
                    cursor: 4,
                    entries: 'a',
                })
            });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });

        it('invalid null entries', function () {
            const history = new History();
            assert.throws(function () {
                history.import({
                    cursor: 4,
                    entries: null,
                })
            });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });

        it('invalid cursor type', function () {
            const history = new History();
            assert.throws(function () {
                history.import({
                    cursor: '4',
                    entries: [],
                })
            });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });

        it('invalid data object type', function () {
            const history = new History();
            assert.throws(function () {
                history.import('aaaa')
            });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });

        it('invalid null data object', function () {
            const history = new History();
            assert.throws(function () {
                history.import(null)
            });
            assert.throws(function () {
                history.import(undefined)
            });
            assert.deepEqual(
                history.export(),
                { cursor: 0, entries: [] }
            );
        });
    });

    describe('#add()', function () {
        it('limit cuts the start', function () {
            const target = getElement();
            const history = new History(2);
            history.add({ start: 4, oldText: '', newText: 'id' });
            history.add({ start: 13, oldText: ';', newText: '' });
            history.add({ start: 20, oldText: 'true', newText: 'id' });
            history.add({ start: 10, oldText: 'y', newText: 'x' });
            history.undo(target);
            history.undo(target);
            history.undo(target);
            history.undo(target);
            assert.equal(target.value, 'let id = \\y.x in id true');
        });
    });

    describe('#undo()', function () {
        it('undo an insertion', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 4, oldText: '', newText: 'id' });
            history.undo(target);
            assert.equal(target.value, 'let  = \\x.x in id id');
        });

        it('undo a deletion', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 13, oldText: ';', newText: '' });
            history.undo(target);
            assert.equal(target.value, 'let id = \\x.x; in id id');
        });

        it('undo a replacement', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 20, oldText: 'true', newText: 'id' });
            history.undo(target);
            assert.equal(target.value, 'let id = \\x.x in id true');
        });

        it('undo two redos', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 4, oldText: '', newText: 'id' });
            history.add({ start: 13, oldText: ';', newText: '' });
            history.add({ start: 20, oldText: 'true', newText: 'id' });
            history.undo(target);
            history.undo(target);
            history.undo(target);
            history.redo(target);
            history.redo(target);
            history.redo(target);
            history.undo(target);
            assert.equal(target.value, 'let id = \\x.x in id true');
        });

        it('undo without history does not change anything', function () {
            const target = getElement();
            const history = new History();
            history.undo(target);
            assert.equal(target.value, 'let id = \\x.x in id id');
        });
    });

    describe('#redo()', function () {
        it('redo an insertion', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 4, oldText: '', newText: 'id' });
            history.undo(target);
            history.redo(target);
            assert.equal(target.value, 'let id = \\x.x in id id');
        });

        it('redo a deletion', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 13, oldText: ';', newText: '' });
            history.undo(target);
            history.redo(target);
            assert.equal(target.value, 'let id = \\x.x in id id');
        });

        it('redo a replacement', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 20, oldText: 'true', newText: 'id' });
            history.undo(target);
            history.redo(target);
            assert.equal(target.value, 'let id = \\x.x in id id');
        });

        it('redo two of three undos', function () {
            const target = getElement();
            const history = new History();
            history.add({ start: 4, oldText: '', newText: 'id' });
            history.add({ start: 13, oldText: ';', newText: '' });
            history.add({ start: 20, oldText: 'true', newText: 'id' });
            history.undo(target);
            history.undo(target);
            history.undo(target);
            history.redo(target);
            history.redo(target);
            assert.equal(target.value, 'let id = \\x.x in id true');
        });

        it('redo without history does not change anything', function () {
            const target = getElement();
            const history = new History();
            history.redo(target);
            assert.equal(target.value, 'let id = \\x.x in id id');
        });
    });
});
