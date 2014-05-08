
var request = require('request');
var zlib = require('zlib');
var querystring = require('querystring');
var _ = require('underscore');

var APP_VERSION = 2417230;


function getHeaders(isAjax, extraHeaders) {
    var headers = {
        'Cache-Control': 'max-age=0',
        'User-Agent': '(nodebot)',
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

    if (extraHeaders) {
        _.extend(headers, extraHeaders);
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

function getFirstPage(username, headers, fn) {

    // allow optional headers
    if (typeof fn === 'undefined' && typeof headers === 'function') {
        fn = headers;
        headers = null;
    }

    requestGzip({
        url: 'http://www.pinterest.com/' + encodeURIComponent(username) + '/pins/',
        headers: getHeaders(false, headers)
    }, function(error, response, body) {
        if (error || response.statusCode != 200) {
            fn(error, null);
        } else {
            //require('fs').writeFile("/tmp/test", body);
            fn(error, body);
        }
    });
}

function getPagination(username, bookmark, headers, fn) {

    // allow optional headers
    if (typeof fn === 'undefined' && typeof headers === 'function') {
        fn = headers;
        headers = null;
    }

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
        headers: getHeaders(true, headers)
    }, function(error, response, data) {
        if (error || response.statusCode != 200) {
            fn(error, null);
        } else {
            //require('fs').writeFile("/tmp/test.pagination.json", data);
            fn(error, data);
        }
    });
}


exports.getFirstPage = getFirstPage;
exports.getPagination = getPagination;
