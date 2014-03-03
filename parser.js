
function getPins(html) {
    var cheerio = require('cheerio');
    var $ = cheerio.load(html);
    var $pins = $('.pinWrapper');

    var pins = [];

    $pins.each(function(i, el) {
        var $t = $(this);

        var $imageWrapper = $t.find('.pinImageWrapper');

        // url
        var url = $imageWrapper.attr('href');
            if (url.substring(0, 1) === '/') {
                url = 'http://www.pinterest.com' + url;
            }

        // id
        var id = /\/pin\/(\d+)\/?$/.exec(url);
        id = id ? id[1] : null;

        // image
        var image = $imageWrapper.find('img').attr('src');

        // description
        var description = $t.find('.pinDescription').text();

        pins.push({
            id: id,
            url: url,
            image: image,
            description: description
        });

        //console.log(pins[pins.length - 1]); //REM
    });

    return pins;
}

function extractBookmark(htmlOrCompleteJson) {
    var bookmark = null;
    if (htmlOrCompleteJson) {
        var bookmarksRe = /"bookmarks":\s*\["([A-z0-9=]+)"\]/gi;
        var sp = htmlOrCompleteJson.split(bookmarksRe);
        bookmark = sp[1];
    }

    //console.log('bookmark!', bookmark); //REM
    return bookmark;
}

exports.getPins = getPins;
exports.extractBookmark = extractBookmark;