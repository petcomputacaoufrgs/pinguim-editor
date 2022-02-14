import * as assert from 'assert';
import { JSDOM } from 'jsdom';
import { Highlighter } from '../highlighter.js';

describe('Highlighter', function () {
    const highlighter = new Highlighter(
        {
            regex: /\bif\b|\bthen\b|\belse\b/,
            className: 'keyword',
        },
        {
            regex: /\b0\b|\btrue\b|\bfalse\b/,
            className: 'literal',
        },
        {
            regex: /\bsucc\b|\bpred\b|\biszero\b/,
            className: 'function',
        },
        {
            regex: /\(/,
            bracket: { name: 'parens', direction: 'opening' },
            className: 'punctuation',
        },
        {
            regex: /\)/,
            bracket: { name: 'parens', direction: 'closing' },
            className: 'punctuation',
        },
    );

    const simpleDom = new JSDOM(
        '<!DOCTYPE html>'
        + '<textarea id="back">if cond then a else b</textarea>'
        + '<pre id="front"></pre>'
    );

    const simpleBack = simpleDom.window.document.getElementById('back');
    const simpleFront = simpleDom.window.document.getElementById('front');

    describe('#highlight(simple)', function () {
        highlighter.highlight(
            simpleBack,
            simpleFront,
            simpleDom.window.document,
        );

        it('there should be 7 elements in <pre>', function () {
            assert.equal(simpleFront.childNodes.length, 7);
        });

        it('this should be the type of every element in <pre>', function () {
            const SpanType = simpleDom.window.HTMLSpanElement;
            const TextType = simpleDom.window.Text;
            const BrType = simpleDom.window.HTMLBRElement;
            assert.ok(simpleFront.childNodes[0] instanceof SpanType);
            assert.ok(simpleFront.childNodes[1] instanceof TextType);
            assert.ok(simpleFront.childNodes[2] instanceof SpanType);
            assert.ok(simpleFront.childNodes[3] instanceof TextType);
            assert.ok(simpleFront.childNodes[4] instanceof SpanType);
            assert.ok(simpleFront.childNodes[5] instanceof TextType);
            assert.ok(simpleFront.childNodes[6] instanceof BrType);
        });

        it('<pre> text content should be the same as textarea', function () {
            assert.equal(simpleFront.textContent, 'if cond then a else b');
        });

        it('this should be the content of every element in <pre>', function () {
            assert.equal(simpleFront.childNodes[0].textContent, 'if');
            assert.equal(simpleFront.childNodes[1].textContent, ' cond ');
            assert.equal(simpleFront.childNodes[2].textContent, 'then');
            assert.equal(simpleFront.childNodes[3].textContent, ' a ');
            assert.equal(simpleFront.childNodes[4].textContent, 'else');
            assert.equal(simpleFront.childNodes[5].textContent, ' b');
            assert.equal(simpleFront.childNodes[6].textContent, '');
        });

        it('this should be the class of every element in <pre>', function () {
            assert.equal(simpleFront.childNodes[0].className, 'keyword');
            assert.equal(simpleFront.childNodes[1].className, undefined);
            assert.equal(simpleFront.childNodes[2].className, 'keyword');
            assert.equal(simpleFront.childNodes[3].className, undefined);
            assert.equal(simpleFront.childNodes[4].className, 'keyword');
            assert.equal(simpleFront.childNodes[5].className, undefined);
            assert.equal(simpleFront.childNodes[6].className, '');
        });
    });

    const complexDom = new JSDOM(
        '<!DOCTYPE html>'
        + '<textarea id="back">'
        + 'if (iszero () ((foo) (succ 0)) ())'
        + '</textarea>'
        + '<pre id="front"></pre>'
    );

    const complexBack = complexDom.window.document.getElementById('back');
    const complexFront = complexDom.window.document.getElementById('front');

    describe('#highlight(complex)', function () {
        complexBack.selectionStart = 14;
        complexBack.selectionEnd = complexBack.selectionStart;
        highlighter.highlight(
            complexBack,
            complexFront,
            complexDom.window.document,
        );

        it('there should be 24 elements in <pre>', function () {
            assert.equal(complexFront.childNodes.length, 24);
        });

        it('this should be the type of every element in <pre>', function () {
            const SpanType = complexDom.window.HTMLSpanElement;
            const TextType = complexDom.window.Text;
            const BrType = complexDom.window.HTMLBRElement;
            assert.ok(complexFront.childNodes[0] instanceof SpanType);
            assert.ok(complexFront.childNodes[1] instanceof TextType);
            assert.ok(complexFront.childNodes[2] instanceof SpanType);
            assert.ok(complexFront.childNodes[3] instanceof SpanType);
            assert.ok(complexFront.childNodes[4] instanceof TextType);
            assert.ok(complexFront.childNodes[5] instanceof SpanType);
            assert.ok(complexFront.childNodes[6] instanceof SpanType);
            assert.ok(complexFront.childNodes[7] instanceof TextType);
            assert.ok(complexFront.childNodes[8] instanceof SpanType);
            assert.ok(complexFront.childNodes[9] instanceof SpanType);
            assert.ok(complexFront.childNodes[10] instanceof TextType);
            assert.ok(complexFront.childNodes[11] instanceof SpanType);
            assert.ok(complexFront.childNodes[12] instanceof TextType);
            assert.ok(complexFront.childNodes[13] instanceof SpanType);
            assert.ok(complexFront.childNodes[14] instanceof SpanType);
            assert.ok(complexFront.childNodes[15] instanceof TextType);
            assert.ok(complexFront.childNodes[16] instanceof SpanType);
            assert.ok(complexFront.childNodes[17] instanceof SpanType);
            assert.ok(complexFront.childNodes[18] instanceof SpanType);
            assert.ok(complexFront.childNodes[19] instanceof TextType);
            assert.ok(complexFront.childNodes[20] instanceof SpanType);
            assert.ok(complexFront.childNodes[21] instanceof SpanType);
            assert.ok(complexFront.childNodes[22] instanceof SpanType);
            assert.ok(complexFront.childNodes[23] instanceof BrType);
        });

        it('<pre> text content should be the same as textarea', function () {
            assert.equal(
                complexFront.textContent,
                'if (iszero () ((foo) (succ 0)) ())'
            );
        });

        it('this should be the content of every element in <pre>', function () {
            assert.equal(complexFront.childNodes[0].textContent, 'if');
            assert.equal(complexFront.childNodes[1].textContent, ' ');
            assert.equal(complexFront.childNodes[2].textContent, '(');
            assert.equal(complexFront.childNodes[3].textContent, 'iszero');
            assert.equal(complexFront.childNodes[4].textContent, ' ');
            assert.equal(complexFront.childNodes[5].textContent, '(');
            assert.equal(complexFront.childNodes[6].textContent, ')');
            assert.equal(complexFront.childNodes[7].textContent, ' ');
            assert.equal(complexFront.childNodes[8].textContent, '(');
            assert.equal(complexFront.childNodes[9].textContent, '(');
            assert.equal(complexFront.childNodes[10].textContent, 'foo');
            assert.equal(complexFront.childNodes[11].textContent, ')');
            assert.equal(complexFront.childNodes[12].textContent, ' ');
            assert.equal(complexFront.childNodes[13].textContent, '(');
            assert.equal(complexFront.childNodes[14].textContent, 'succ');
            assert.equal(complexFront.childNodes[15].textContent, ' ');
            assert.equal(complexFront.childNodes[16].textContent, '0');
            assert.equal(complexFront.childNodes[17].textContent, ')');
            assert.equal(complexFront.childNodes[18].textContent, ')');
            assert.equal(complexFront.childNodes[19].textContent, ' ');
            assert.equal(complexFront.childNodes[20].textContent, '(');
            assert.equal(complexFront.childNodes[21].textContent, ')');
            assert.equal(complexFront.childNodes[22].textContent, ')');
            assert.equal(complexFront.childNodes[23].textContent, '');
        });

        it('this should be the class of every element in <pre>', function () {
            assert.equal(complexFront.childNodes[0].className, 'keyword');
            assert.equal(complexFront.childNodes[1].className, undefined);
            assert.equal(complexFront.childNodes[2].className, 'punctuation');
            assert.equal(complexFront.childNodes[3].className, 'function');
            assert.equal(complexFront.childNodes[4].className, undefined);
            assert.equal(complexFront.childNodes[5].className, 'punctuation');
            assert.equal(complexFront.childNodes[6].className, 'punctuation');
            assert.equal(complexFront.childNodes[7].className, undefined);
            assert.equal(
                complexFront.childNodes[8].className,
                'punctuation selected-bracket',
            );
            assert.equal(complexFront.childNodes[9].className, 'punctuation');
            assert.equal(complexFront.childNodes[10].className, undefined);
            assert.equal(complexFront.childNodes[11].className, 'punctuation');
            assert.equal(complexFront.childNodes[12].className, undefined);
            assert.equal(complexFront.childNodes[13].className, 'punctuation');
            assert.equal(complexFront.childNodes[14].className, 'function');
            assert.equal(complexFront.childNodes[15].className, undefined);
            assert.equal(complexFront.childNodes[16].className, 'literal');
            assert.equal(complexFront.childNodes[17].className, 'punctuation');
            assert.equal(
                complexFront.childNodes[18].className,
                'punctuation selected-bracket',
            );
            assert.equal(complexFront.childNodes[19].className, undefined);
            assert.equal(complexFront.childNodes[20].className, 'punctuation');
            assert.equal(complexFront.childNodes[21].className, 'punctuation');
            assert.equal(complexFront.childNodes[22].className, 'punctuation');
            assert.equal(complexFront.childNodes[23].className, '');
        });
    });
});
