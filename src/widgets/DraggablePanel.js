/**
 * A panel which can be dragged inside the current window.
 */
export class DraggablePanel {

    /**
     * The DOM of this object.
     * 
     * @readonly
     * @type {HTMLDivElement}
     */
    dom;

    /**
     * The position of the top edge of this panel, relative to its parent.
     * 
     * @type {number}
     */
    get top() { return Number(this.dom.style.top.replace('px', '')); }

    set top(value) { this.dom.style.top = `${value}px`; }

    /**
     * The position of the left edge of this panel, relative to its parent.
     * 
     * @type {number}
     */
    get left() { return Number(this.dom.style.left.replace('px', '')); }

    set left(value) { this.dom.style.left = `${value}px`; }

    /**
     * Aligns this panel with the top edge of its parent.
     * 
     * @returns {this} This object.
     */
    alignTop() {
        this.top = 0;

        return this;
    }

    /**
     * Aligns this panel with the bottom edge of its parent.
     * 
     * @returns {this} This object.
     */
    alignBottom() {
        const parentElement = this.dom.parentElement;
        const parentHeight = (parentElement == null) ? window.innerHeight
            : parentElement.getBoundingClientRect().height;

        this.top = parentHeight - this.dom.getBoundingClientRect().height;

        return this;
    }

    /**
     * Vertically aligns this panel with the center of its parent.
     * 
     * @returns {this} This object.
     */
    alignCenterVertical() {
        this.alignBottom();

        this.top /= 2;

        return this;
    }

    /**
     * Aligns this panel with the left edge of its parent.
     * 
     * @returns {this} This object.
     */
    alignLeft() {
        this.left = 0;

        return this;
    }

    /**
     * Aligns this panel with the right edge of its parent.
     * 
     * @returns {this} This object.
     */
    alignRight() {
        const parentElement = this.dom.parentElement;
        const parentWidth = (parentElement == null) ? window.innerWidth
            : parentElement.getBoundingClientRect().width;

        this.left = parentWidth - this.dom.getBoundingClientRect().width;

        return this;
    }

    /**
     * Horizontally aligns this panel with the center of its parent.
     * 
     * @returns {this} This object.
     */
    alignCenterHorizontal() {
        this.alignRight();

        this.left /= 2;

        return this;
    }

    /**
     * Displays the header of this panel.
     * 
     * @readonly
     * @type {HTMLDivElement}
     */
    #headerDiv;

    /**
     * Displays the title of this panel and acts as the target for click-and-dragging.
     * 
     * @readonly
     * @type {HTMLLabelElement}
     */
    #titleLabel;

    /**
     * @type {string}
     */
    #title;

    /**
     * The title of this panel.
     * 
     * @type {string}
     */
    get title() { return this.#title; }

    set title(value) {
        if (this.title !== value) {
            this.#title = value;

            this.#titleLabel.textContent = value;
        }
    }

    /**
     * When clicked on, toggles whether the content of this panel is collapsed or not.
     * 
     * @readonly
     * @type {HTMLLabelElement}
     */
    #toggleCollapsedLabel;

    /**
     * @type {boolean}
     */
    #isCollapsed;

    /**
     * `true` if the content of this panel is collapsed; otherwise, `false`.
     * 
     * @type {boolean}
     */
    get isCollapsed() { return this.#isCollapsed; }

    set isCollapsed(value) {
        if (this.isCollapsed !== value) {
            this.#isCollapsed = value;

            if (value) {
                this.dom.classList.add('collapsed');
            } else {
                this.dom.classList.remove('collapsed');
            }

            this.#toggleCollapsedLabel.textContent = value ? '+' : '\u2212';
        }
    }

    /**
     * The content of this panel, if any.
     * 
     * @type {?Element}
     */
    get content() { return this.dom.children[1] ?? null; }

    set content(value) {
        const prevContent = this.content;
        if (prevContent !== value) {
            if (prevContent != null) {
                this.dom.removeChild(prevContent);
            }

            if (value != null) {
                this.dom.appendChild(value);
            }
        }
    }

    /**
     * The previous position of the pointer.
     * 
     * @type {?{x: number, y: number}}
     */
    #prevPointerPos = null;

    /**
     * Whether the panel is being dragged.
     * 
     * @type {boolean}
     */
    #dragging = false;

    /**
     * Creates a new draggable panel.
     * 
     * @param {string} title The title of the panel.
     * @param {?Element} content The content of the panel. (Optional)
     * @param {number} top The position of the top edge of the panel, relative to its parent.
     * Defaults to `0`.
     * @param {number} left The position of the left edge of the panel, relative to its parent.
     * Defaults to `0`.
     */
    constructor(title, content = null, top = 0, left = 0) {
        this.dom = document.createElement('div');
        this.dom.className = 'draggable-panel';
        this.dom.style.position = 'absolute';

        this.#headerDiv = document.createElement('div');
        this.#headerDiv.className = 'header';
        {
            this.#titleLabel = document.createElement('label');
            this.#titleLabel.style.cursor = 'grab';
            this.#titleLabel.addEventListener('pointerdown', (e) => {
                this.#titleLabel.setPointerCapture(e.pointerId);

                e.preventDefault();     // Avoid highlighting content

                this.#prevPointerPos = { x: e.clientX, y: e.clientY };
                this.#dragging = true;
                this.#titleLabel.style.cursor = 'grabbing';
            });
            this.#titleLabel.addEventListener('pointermove', (e) => {
                if (!this.#dragging || this.#prevPointerPos == null) return;

                const prevPointerPos = this.#prevPointerPos;
                const nextPointerPos = { x: e.clientX, y: e.clientY };

                const rect = this.dom.getBoundingClientRect();
                this.top = rect.top + nextPointerPos.y - prevPointerPos.y;
                this.left = rect.left + nextPointerPos.x - prevPointerPos.x;

                this.#prevPointerPos = nextPointerPos;
            });
            this.#titleLabel.addEventListener('pointerup', (e) => {
                this.#titleLabel.releasePointerCapture(e.pointerId);

                if (!this.#dragging) return;

                this.#dragging = false;
                this.#titleLabel.style.cursor = 'grab';
            });

            this.#headerDiv.appendChild(this.#titleLabel);

            this.#toggleCollapsedLabel = document.createElement('label');
            this.#toggleCollapsedLabel.addEventListener('pointerdown', () => {
                this.isCollapsed = !this.isCollapsed;
            });
            this.#headerDiv.appendChild(this.#toggleCollapsedLabel);
        }
        this.dom.appendChild(this.#headerDiv);

        this.title = title;
        this.isCollapsed = false;
        this.content = content;
        this.top = top;
        this.left = left;
    }
}
