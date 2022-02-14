/**
 * @class Highliter implements the logic for highlighting source code, while
 *                      decoupling it from the whole editor's logic. It does
 *                      so by not storing source code DOM state, and simply
 *                      requring DOM elements as parameters when necessary.
 */
export class Highlighter {
    /**
     * @constructor Constructs the highlighter with list of highlighting rules.
     * 
     * @param  {...object} types Multiple parameters are supported, but they all
     *                              need to be in the following format:
     *                              {
     *                                  regex: Regex,
     *                                  className: string,
     *                                  bracket: {
     *                                      name: string,
     *                                      diretion: 'opening' | 'closing'
     *                                  }
     *                              }
     *                              where "bracket" is optional.
     *                              "regex" defines the RegEx that recognizes a
     *                              certain type of token, while "className"
     *                              defines the CSS class that will be
     *                              attributed to these tokens. If bracket is
     *                              given, when the editor's cursor is behind
     *                              a token recognized by this rule, an
     *                              additional CSS class is given to the token
     *                              and to another corresponding token, such
     *                              that one type of token "opens" and the other
     *                              "closes" the first one.
     */
    constructor(...types) {
        this.types = types;

        const alternatives = types.map(type => '(' + type.regex.source + ')');
        const flags = types.reduce(
            (flags, type) => {
                for (const flag of type.regex.flags) {
                    if (flags.indexOf(flag) < 0) {
                        flags += flag;
                    }
                }
                return flags;
            },
            ''
        );

        this.splitRegex = new RegExp(alternatives.join('|'), flags);
    }

    /**
     * @method highlight Highlights the code from a textarea into a pre, using
     *                      the rules given to the highlighter in constructor.
     * 
     * @param {HTMLTextAreaElement} inputElement Element where source code the
     *                                           user writes to.
     * @param {HTMLPreElement} targetElement Element where highlighted code will
     *                                          be displayed.
     * @param {Document} dom Object representing a page's document. Optional if
     *                          being used on the browser.
     */
    highlight(inputElement, targetElement, dom) {
        dom = dom || document;
        const baseText = inputElement.value;
        const brackets = {};
        let index = 0;

        targetElement.innerHTML = '';

        for (let piece of baseText.split(this.splitRegex)) {
            if (piece == undefined || piece == '') {
                continue;
            }

            const type = this.types.find(type => type.regex.test(piece));

            let child;
            if (type === undefined) {
                child = dom.createTextNode(piece);
            } else {
                child = dom.createElement('span');
                child.setAttribute('class', type.className);
                child.textContent = piece;

                if (type.bracket !== undefined) {
                    this.handleBrackets(
                        inputElement,
                        piece,
                        type,
                        brackets,
                        index,
                        child,
                    );
                }
            }

            targetElement.appendChild(child);
            index += piece.length;
        }

        targetElement.appendChild(dom.createElement('br'));
    }

    /**
     * @method handleBrackets Higlights brackets in general, matching
     *                          opening and closing brackets.
     * 
     * @private to this class
     * 
     * @param {HTMLTextAreaElement} inputElement Element where the user writes
     *                                              code to.
     * @param {string} piece Piece of string being highlighted.
     * @param {object} type Type of token, in the same format as in constructor.
     * @param {array} brackets Array of objects containg bracket data,
     *                          where brackets are stacked-up.
     * @param {int} index       Index of the token start in input string.
     * @param {HTMLElement} child Child element where the bracket is displayed.
     */
    handleBrackets(inputElement, piece, type, brackets, index, child) {
        let isSelected = (
            inputElement.selectionStart == index
            && inputElement.selectionEnd <= index + piece.length
        );
        const name = type.bracket.name;
        brackets[name] = brackets[name] || [];

        switch (type.bracket.direction) {
            case 'opening': {
                brackets[name].push({ node: child, selected: isSelected });
                break;
            }
            case 'closing': {
                const prev = brackets[name].pop();
                if (prev !== undefined && (prev.selected || isSelected)) {
                    let cls = child.getAttribute('class');
                    child.setAttribute('class', cls + ' selected-bracket');

                    cls = prev.node.getAttribute('class');
                    prev.node.setAttribute('class', cls + ' selected-bracket');
                }

                break;
            }
        }
    }
}
