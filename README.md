
Pinterest API
=============

## What is it

There’s no external API for Pinterest. Here’s a purely academic project that I wrote back in the summer of 2014 using Node to make something like an API for Pinterest (leveraging the public pages on the Pinterest website). Currently it only loads pins given a user. It is a great way to backup your own pins. **Do not use this against the Pinterest terms of service.**

The relevant files are:

*   pinterest-api.js - exposes the main API methods
*   urls.js - handles all HTTP requests
*   parser.js - handles reading HTML and parsing into JSON

You can run a test call from the command-line via:

```
node test.js <username>
```

## API Methods

### PinterestApi.getPinsPage(username[, bookmark][, headers], callback)

Asynchronous lookup of the pins for a user from one page, either
specified by optional argument `bookmark` (defaults to the first page)
and using an optional `headers` argument (in the form of an object).

The callback is called as `callback(error, data)`, where data is
an object containing:

-   pins: array of pin objects
-   nextBookmark: string for next page of pins (or null)


### PinterestAPI.requestPins(username[, headers])

Asynchronous lookup of all pins for the given username
across several paginations.

Returns a request object that triggers the following
events:

-   data: {pins: [], nextBookmark: string, page: number})
-   error: e
-   end: {pages: number, totalPins: int}

The "data" event can be triggered multiple times, depending
on how many pins the given user has pinned. However, "error"
and "end" will only get triggered once and mutually exclusively.

They can be listened to via:

    var req = requestPins(username);
    req.on('data', function(data) { ... });
    req.on('error', function(error) { ... });
    req.on('end', function(data) { ... });
