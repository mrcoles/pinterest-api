/* globals JSON, require, exports */

var urls = require('./urls');
var parser = require('./parser');

var EventMap = function EventMap() {
    var self = this;
    var map = {};

    this.on = function(eventName, fn) {
        if (!map[eventName]) {
            map[eventName] = [];
        }
        map[eventName].push(fn);
    };

    this.trigger = function(eventName, args) {
        (map[eventName] || []).forEach(function(fn, i) {
            fn.apply(self, args);
        });
    };
};


/**
 * PinterestApi.getPinsPage
 * ------------------------
 *
 * Asynchronous lookup of the pins for a user from one page, either
 * specified by optional argument `bookmark` (defaults to the first page)
 * and using an optional `headers` argument (in the form of an object).
 *
 * The callback is called as `callback(error, data)`, where data is
 * an object containing:
 *
 * -   pins: array of pin objects
 * -   nextBookmark: string for next page of pins (or null)
 *
 */
function getPinsPage(username, bookmark, headers, callback) {

    // allow optional bookmark
    if (typeof callback === 'undefined') {
        if (typeof headers === 'function') {
            callback = headers;
            headers = null;
            if (typeof bookmark === 'object') {
                headers = bookmark;
                bookmark = null;
            }
        } else if (typeof bookmark === 'function') {
            callback = bookmark;
            bookmark = headers = null;
        } else {
            throw new Error('Invalid arguments, must include a callback');
        }
    }

    if (!bookmark) {

        // first page - no bookmark
        urls.getFirstPage(username, headers, function(error, body) {
            if (error) {
                return callback(error);
            }

            var pins = parser.getPins(body);
            var bookmark = parser.extractBookmark(body);

            return callback(null, {
                pins: pins,
                nextBookmark: bookmark
            });
        });

    } else {

        // paginated page - has bookmark
        urls.getPagination(username, bookmark, headers, function(error, body) {
            if (error) {
                return callback(error);
            }

            var pins = [];
            var bookmark = parser.extractBookmark(body);

            var json = null;
            try {
                json = JSON.parse(body);
            } catch(e) {
                return callback(e);
            }

            if (json && json.module && json.module.html) {
                var html = json.module.html;
                pins = parser.getPins(html);
            }

            return callback(null, {
                pins: pins,
                nextBookmark: bookmark
            });
        });
    }
};


/**
 * PinterestApi.requestPins
 * ------------------------
 *
 * Asynchronous lookup of all pins for the given username
 * across several paginations.
 *
 * Returns a request object that triggers the following
 * events:
 *
 * -   data: {pins: [], nextBookmark: string, page: number})
 * -   error: e
 * -   end: {pages: number, totalPins: int}
 *
 * The "data" event can be triggered multiple times, depending
 * on how many pins the given user has pinned. However, "error"
 * and "end" will only get triggered once and mutually exclusively.
 *
 * They can be listened to via:
 *
 *     var req = requestPins(username);
 *     req.on('data', function(data) { ... });
 *     req.on('error', function(error) { ... });
 *     req.on('end', function(data) { ... });
 *
 */
function requestPins(username, headers) {

    var eventMap = new EventMap();
    var first = true;
    var page = 0;
    var totalPins = 0;

    (function paginate(bookmark) {
        if (first || bookmark) {
            first = false;
            page += 1;

            getPinsPage(username, bookmark, headers, function(error, data) {
                var nextBookmark = null;

                if (error) {
                    eventMap.trigger('error', [error]);
                } else {
                    data.page = page;
                    totalPins += data.pins.length;
                    nextBookmark = data.nextBookmark;
                    eventMap.trigger('data', [data]);
                }

                paginate(nextBookmark);
            });
        } else {
            eventMap.trigger('end', [{pages: page, totalPins: totalPins}]);
        }
    })();

    return eventMap;
};


exports.getPinsPage = getPinsPage;
exports.requestPins = requestPins;

