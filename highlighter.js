export class Highlighter {
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
                    this.handleParens(
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

    handleParens(inputElement, piece, type, brackets, index, child) {
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
