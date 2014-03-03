
var urls = require('./urls');
var parser = require('./parser');

// function getLocal(fn) {
//     var fs = require('fs');
//     return fs.readFile('/tmp/test', 'utf8', function(err, data) {
//         fn(err, data);
//     });
// }

var EventMap = function() {
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



function requestPins(username) {

    /*
     * ON
     * data ({pins: [], bookmark: str, page: int})
     * end ({pages: int, totalPins: int})
     * error (e)
     */

    var eventMap = new EventMap();

    urls.getFirstPage(username, function(error, body) {

        if (error) {
            return eventMap.trigger('error', [error]);
        }

        var pins = parser.getPins(body);
        var bookmark = parser.extractBookmark(body);
        var page = 1;
        var totalPins = pins.length;

        eventMap.trigger('data', [{
            pins: pins,
            bookmark: bookmark,
            page: page
        }]);

        (function paginate(bookmark) {
            if (!bookmark) {
                eventMap.trigger('end', [{pages: page, totalPins: totalPins}]);
            } else {
                page++;

                urls.getPagination(username, bookmark, function(error, body) {
                    if (error) {
                        return eventMap.trigger('error', [error]);
                    }

                    var newPins = null;
                    var newBookmark = parser.extractBookmark(body);

                    var json = null;
                    try {
                        json = JSON.parse(body);
                    } catch(e) {
                        //console.log('[ERROR] parsing json', e); //REM
                        return eventMap.trigger('error', [e]);
                    }

                    if (json && json.module && json.module.html) {
                        var html = json.module.html;
                        newPins = parser.getPins(html);
                        totalPins += newPins.length;

                        eventMap.trigger('data', [{
                            pins: newPins,
                            bookmark: newBookmark,
                            page: page
                        }]);

                        if (!newPins.length) {
                            newBookmark = null;
                        }
                    }
                    return paginate(newBookmark);
                });
            }
        })(bookmark);

        return null;
    });

    return eventMap;
}

exports.requestPins = requestPins;
