var RegularFileWriter = require ('./Writer').RegularFileWriter;
var LineByLineReader = require ('./LineByLineReader');
var COMMENT_STARTERS = ['//', '#', "<!--"];
const expression_android = /[a-zA-Z0-9]{1,10}.xml/i;
const andriod_wrap = ["", "<"]

function checkIsComment (val) {
    for (var i = 0; i < COMMENT_STARTERS.length; i++) {
        var commentStarter = COMMENT_STARTERS[i];
        if (val.indexOf (commentStarter) == 0) {
            return true;
        }
    }
    return false;
};

const androidTransformer = {
    header : ['<?xml version="1.0" encoding="utf-8"?>', '<resources>', '<!-- AUTO-GENERATED -- DO NOT EDIT THE LINES BELOW-->'],
    footer : ['</resources>']
};

if (!String.prototype.splice) {
    /**
     * {JSDoc}
     *
     * The splice() method changes the content of a string by removing a range of
     * characters and/or adding new characters.
     *
     * @this {String}
     * @param {number} start Index at which to start changing the string.
     * @param {number} delCount An integer indicating the number of old chars to remove.
     * @param {string} newSubStr The String that is spliced in.
     * @return {string} A new string with the spliced substring.
     */
    String.prototype.splice = function (start, delCount, newSubStr) {
        return this.slice (0, start) + newSubStr + this.slice (start + Math.abs (delCount));
    };
}

function ProcessFile (fileName, parentPath, lang, finishCB) {
    // console.log("enter process");
    var lr = new LineByLineReader (fileName, { skipEmptyLines : true });
    var lines = [];
    var file_name = "";
    var writer;
    var line_recording = false;

    function writeInternal () {
        if (file_name === "") {
            return false;
        }
        if (lines.length === 0) {
            return false;
        }
        writer = new RegularFileWriter ();
        //    var line_m = androidTransformer.header;
        var line2 = androidTransformer.header.concat (lines);
        var line3 = line2.concat (androidTransformer.footer);
        writer.write (file_name, "utf8", line3);
        console.log ("Split file - ", file_name);
        file_name = "";
        lines = [];
        return true;
    }

    lr.on ('error', function (err) {
        console.log (err);
        throw err;
    });

    lr.on ('open', function () {
        // Do something, like initialise progress bar etc.
        lines = [];
        file_name = "";
    });

    lr.on ('line', function (line) {
        line_recording = true;
        // console.log (++row + ": " + line);
        if (checkIsComment (line)) {
            //console.log ("comment here", line);
            if (expression_android.test (line)) {
                var found = line.match (expression_android);
                var res = writeInternal (file_name);
                file_name = parentPath + found[0].splice (-4, 0, "_" + lang);
            }
        }
        if (file_name == "") {
            line_recording = false;
        }
        if (line.indexOf ("</resources>") > -1) {
            line_recording = false;
        }
        if (line_recording) {
           // console.log ("add L ", line);
            lines.push (line);
        }

    });

    lr.on ('end', function () {
        writeInternal (file_name);
        finishCB ();
    });
}

module.exports = ProcessFile;
