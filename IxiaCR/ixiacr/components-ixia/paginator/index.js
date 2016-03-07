var emitter = require('emitter'),
    domify = require('domify'),
    classes = require('classes'),
    event = require('event'),
    template = domify(require('./template.js')),
    previous_pages = 2,
    pages_visible = 5;

function Paginator() {
    this.$el = undefined;
    this.page = 1;
    this.num_pages = undefined;
}

emitter(Paginator.prototype);

Paginator.prototype.pages = function (pages) {
    if (arguments.length) {
        this.num_pages = Math.max(1, pages); // Ensure >= 1

        // Ensure this.page is withing this.num_pages (in case a page was removed)
        this.page = Math.min(this.page, this.num_pages);
    }

    return this.num_pages;
};

Paginator.prototype.render = function () {
    var $el = this.$el || template.cloneNode(true),
        page = this.page,
        $prev_ellipses = $el.querySelector('.ellipses.prev'),
        $next_ellipses = $el.querySelector('.ellipses.next'),
        // Always show 5 pages, even if the current page is near the end
        at_end = this.num_pages - pages_visible + 1 < page - previous_pages,
        first = at_end ? Math.max(1, this.num_pages - pages_visible + 1) : Math.max(1, page - previous_pages),
        last = Math.min(this.num_pages, first + pages_visible - 1),
        i,
        $pages = $el.querySelector('.pages'),
        $page,
        $page_link;

    this.$el = $el;

    // Ellipses before page links
    if (first === 1) {
        classes($prev_ellipses).add('hidden');
    } else {
        classes($prev_ellipses).remove('hidden');
    }

    // Remove existing page links
    while ($pages.firstChild) {
        $pages.removeChild($pages.firstChild);
    }

    // Insert page links for current pages
    for (i = first; i <= last; i += 1) {
        $page = document.createElement('li');
        $page_link = document.createElement('a');
        $page_link.innerHTML = String(i);
        if (i === page) {
            classes($page).add('current');
        }
        event.bind($page_link, 'click', this.goto.bind(this, i));

        $page.appendChild($page_link);
        $pages.appendChild($page);
    }

    // Ellipses after page links
    if (last === this.num_pages) {
        classes($next_ellipses).add('hidden');
    } else {
        classes($next_ellipses).remove('hidden');
    }

    return $el;
};

Paginator.prototype.next = function () {
    this.page += 1;
    this.goto(this.page);
};

/**
 * @param page 1-indexed
 * @param e "click" event from DOM (when .goto() is bound to an element)
 */
Paginator.prototype.goto = function (page, e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    this.page = page;
    this.render();
    this.emit("change", this.page, this);
};

module.exports = Paginator;