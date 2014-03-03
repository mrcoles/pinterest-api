
var request = require('request');
var zlib = require('zlib');
var querystring = require('querystring');
var _ = require('underscore');

var APP_VERSION = 2417230;


function getHeaders(isAjax) {
    var headers = {
        'Cache-Control': 'max-age=0',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip,deflate,sdch',
        'Accept-Language': 'en-US,en;q=0.8',
        'Host': 'www.pinterest.com'
    };

    if (isAjax) {
        _.extend(headers, {
            'X-APP-VERSION': APP_VERSION,
            // 'X-CSRFToken': 'HXsl1ecrV2ZJluQ9hQPPU...',
            'X-NEW-APP': 1,
            'X-Requested-With': 'XMLHttpRequest'
        });
    }
    return headers;
}

function requestGzip(options, callback) {
    // `encoding: null` is required for gzip decoding?!?!
    // https://github.com/mikeal/request/issues/747
    options = _.extend({encoding: null}, options);

    request.get(options, function(error, response, body) {
        if (error) {
            callback(error, response, body);
        } else {
            // determine encoding and handle
            var encoding = response.headers['content-encoding'];
            if (encoding == 'gzip') {
                zlib.gunzip(body, function(err, decoded) {
                    callback(err, response, decoded && decoded.toString('utf8'));
                });
            } else if (encoding == 'deflate') {
                zlib.inflate(body, function(err, decoded) {
                    callback(err, response, decoded && decoded.toString('utf8'));
                });
            } else {
                callback(error, response, body);
            }
        }
    });
}

function getFirstPage(username, fn) {

    requestGzip({
        url: 'http://www.pinterest.com/' + encodeURIComponent(username) + '/pins/',
        headers: getHeaders()
    }, function(error, response, body) {
        if (error || response.statusCode != 200) {
            //console.log('[ERROR]', error); //REM
            fn(error, null);
        } else {
            require('fs').writeFile("/tmp/test", body); //REM
            fn(error, body);
        }
    });
}

function getPagination(username, bookmark, fn) {

    // base url
    var baseUrl = 'http://www.pinterest.com/resource/UserPinsResource/get/';

    // query string
    var sourceUrl = '/' + encodeURIComponent(username) + '/pins/';

    var data = {
        "options": {
            "username": username,
            "bookmarks": [bookmark]
        },
        "context": {
            "app_version": APP_VERSION,
            "https_exp": false
        },
        "module": {
            "name": "GridItems",
            "options": {
                "scrollable": true,
                "show_grid_footer": true,
                "centered": true,
                "reflow_all": true,
                "virtualize": true,
                "item_options": {
                    "show_pinner": true,
                    "show_pinned_from": false,
                    "show_board": true,
                    "squish_giraffe_pins": false
                },
                "layout": "variable_height"
            }
        },
        "append": true,
        "error_strategy": 1
    };

    var queryStringData = {
        source_url: sourceUrl,
        data: JSON.stringify(data),
        "_": (new Date()).getTime()
    };

    // full url
    var url = baseUrl + '?' + querystring.stringify(queryStringData);

    // make the request
    requestGzip({
        url: url,
        headers: getHeaders(true)
    }, function(error, response, data) {
        if (error || response.statusCode != 200) {
            //console.log('[ERROR]', error); //REM
            fn(error, null);
        } else {
            require('fs').writeFile("/tmp/test.pagination.json", data); //REM
            fn(error, data);
        }
    });
}

var Pager = {

    request: function request(username, bookmark) {

        var querystring = require('querystring'),
            qsData = Pager._getData(username, bookmark),
            url = Pager._baseUrl + querystring.stringify(qsData);

        console.log('URL', url);

    },

    _baseUrl: 'http://www.pinterest.com/resource/UserPinsResource/get/',

    _getData: function _getQueryString(username, bookmark) {

        var sourceUrl = '/' + encodeURIComponent(username) + '/pins/';

        var data = {
            "source_url": sourceUrl,
            "data": {
                "options": {
                    "username": username,
                    "bookmarks": [bookmark]
                },
                "context": {
                    "app_version": "2417230",
                    "https_exp": false
                },
                "module": {
                    "name": "GridItems",
                    "options": {
                        "scrollable": true,
                        "show_grid_footer": true,
                        "centered": true,
                        "reflow_all": true,
                        "virtualize": true,
                        "item_options": {
                            "show_pinner": true,
                            "show_pinned_from": false,
                            "show_board": true,
                            "squish_giraffe_pins": false
                        },
                        "layout": "variable_height"
                    }
                },
                "append": true,
                "error_strategy": 1
            },
            "_": (new Date()).getTime()
        };

        return {
            source_url: sourceUrl,
            data: JSON.stringify(data)
        };
    }

};



exports.getFirstPage = getFirstPage;
exports.getPagination = getPagination;
