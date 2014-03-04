
var pinterest = require('./pinterest-api');

var username = process.argv[2];

if (!username) {
    console.log('Please pass a username, example: node test.js <username>');

} else {
    var req = pinterest.requestPins(username);

    req.on('data', function(data) {
        console.log('\n\n\n\n### Page ' + data.page + '\n');

        data.pins.forEach(function(pin, i) {
            console.log(pin);
        });

        console.log('\nBookmark', data.nextBookmark);
    });

    req.on('error', function(err) {
        console.log('error', err);
    });

    req.on('end', function(data) {
        console.log('pages', data.pages, 'totalPins', data.totalPins);
    });
}
