/**
 * @fileoverview Alph.ChineseDict - adaptation of PeraPera-Kun's cpkdata.js
 *  
 * @author
 * <pre>
 * PeraPera-Kun 
 * A modded version of Rikai-Chan by Justin Kovalchuk
 * Original Author: Jonathan Zarate
 * Copyright (C) 2005-2006
 * http://www.polarcloud.com/
 * Based on rikaiXUL 0.4 by Todd Rudick
 * http://rikaixul.mozdev.org/
 * ---
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *G NU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 * </pre>
 * 
 * @version $Id$
 */

/**
 * @class Alph.ChineseDict contains the Chinese dictionary lookup functionality.
 * @constructor
 *
 * @param {boolean} a_loadNames whether to load names dictionary
 */
Alph.ChineseDict = function (a_loadNames)
{
    Alph.util.log("Loading Chinese");

    this.loadDictionary();
    if (a_loadNames)
        this.loadNames();
}

Alph.ChineseDict.prototype =
{

    /**
     * read file from URL
     * 
     * If a_charset is specified, the input is converted from that character
     * set to Unicode.
     * 
     * @param {String} a_url URL to read
     * @param {String} a_charset character set (or null for no conversion)
     * 
     * @returns contents of URL converted to specified character set
     * @type String
     */
    fileRead: function(a_url, a_charset)
    {
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService);
        var ss = Components.classes["@mozilla.org/scriptableinputstream;1"]
                           .getService(Components.interfaces
                                                 .nsIScriptableInputStream);
        var ch = ios.newChannel(a_url, null, null);
        var inp = ch.open();
        ss.init(inp);
        var buffer = ss.read(inp.available());
        ss.close();
        inp.close();

        if (!a_charset)
            return buffer;

        var conv =
            Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
                      .createInstance(Components.interfaces
                                                .nsIScriptableUnicodeConverter);
        conv.charset = a_charset;
        return conv.ConvertToUnicode(buffer);
    },

    /**
     * load names dictionary
     */
    loadNames: function()
    {
        if ((this.nameDict) && (this.nameIndex))
            return;
        this.nameDict = this.fileRead(rcxNamesDict.datURI,
                                      rcxNamesDict.datCharset);
        this.nameIndex = this.fileRead(rcxNamesDict.idxURI,
                                       rcxNamesDict.idxCharset);
    },

    /**
     * load regular dictionary
     * 
     * Files in dictionary are:
     * <pre>
     * adso.dat    dictionary entries
     * simp.idx    index of entries using simplified characters
     * trad.idx    index of entries using traditional characters
     * hanzi.dat   character information
     * </pre>
     * 
     * Make sure that the last line in index files and hanzi file are
     * newline-terminated or else binary search might fail.
     */
    loadDictionary: function()
    {
        this.wordDict =
            this.fileRead("chrome://alpheios-chinese/content/adso.dat",
                          "UTF-8");

        this.wordIndexSimp =
            this.fileRead("chrome://alpheios-chinese/content/simp.idx",
                          "UTF-8");
        if (this.wordIndexSimp[this.wordIndexSimp.length - 1] != '\n')
            this.wordIndexSimp += '\n';

        this.wordIndexTrad =
            this.fileRead("chrome://alpheios-chinese/content/trad.idx",
                          "UTF-8");
        if (this.wordIndexTrad[this.wordIndexTrad.length - 1] != '\n')
            this.wordIndexTrad += '\n';

        this.hanziData =
            this.fileRead("chrome://alpheios-chinese/content/hanzi.dat",
                          "UTF-8");
        if (this.hanziData[this.hanziData.length - 1] != '\n')
            this.hanziData += '\n';
    },

    /**
     * do binary search in data
     * 
     * The data is assumed to be a sorted collection of newline-separated
     * lines.  The key being searched for must be at the start of the line.
     * The caller is responsible for appending any separator needed to
     * uniquely identify the key.
     * 
     * Multiple lines with the same key are allowed.  The offset of the first
     * such line will be returned.
     *
     * @param {String} a_data  data to search
     * @param {String} a_key   key to search for
     * 
     * @return offset of key in data or -1 if not found
     * @type int
     */
    binarySearch: function(a_data, a_key)
    {
        const tlen = a_key.length;
        var mid;
        var midStr;

        // start with entire range of data
        var beg = 0;
        var end = a_data.length - 1;

        // while data still remains
        while (beg < end)
        {
            // find line containing midpoint of remaining data
            mid = a_data.lastIndexOf('\n', (beg + end) >> 1) + 1;
            midStr = a_data.substr(mid, tlen);

            // if too high, restrict to first half
            if (a_key < midStr)
                end = mid - 1;
            // if too low, restrict to second half
            else if (a_key > midStr)
                beg = a_data.indexOf('\n', mid) + 1;
            // if equal, done
            else
                break;
        }

        // if found, back up to first line with key
        if (beg < end)
        {
            // while non-empty preceding line exists
            while (mid >= 2)
            {
                // find start of preceding line
                prec = a_data.lastIndexOf('\n', mid - 2) + 1;

                // if preceding line has different key then done,
                // else back up to preceding line
                midStr = a_data.substr(prec, tlen);
                if (a_key != midStr)
                    break;
                mid = prec;
            }

            return mid;
        }

        // not found
        return -1;
    },

    /**
     * find data by key
     *
     * The data is assumed to be suitable for search using #binarySearch
     * 
     * @param {String} a_data   data to search
     * @param {String} a_key    key to search for
     * 
     * @returns subset of data matching key, else null
     * @type String
     *
     */
    findData: function(a_data, a_key)
    {
        // if key not found at all, return empty string
        start = this.binarySearch(a_data, a_key);
        if (start == -1)
            return null;

        const tlen = a_key.length;
        end = start;

        // while more lines remain
        while (end < a_data.length)
        {
            // find start of next line
            end = a_data.indexOf('\n', end) + 1;
            if (end == 0)
                end = a_data.length;

            // if next line has different key then done,
            // else include this line in output
            test = a_data.substr(end, tlen);
            if (a_key != test)
                break;
        }

        return a_data.substring(start, end);
    },

    /**
     * convert pinyin with numeric tone numbers to accented characters
     * 
     * @param {String} a_pinyin    pinyin to convert (may be space-separated list)
     *
     * @return string with accented characters
     * @type String
     */
    formatPinyin: function(a_pinyin)
    {
        // pinyin info
        const _a = ["\u0101", "\u00E1", "\u01CE", "\u00E0", "a"];
        const _e = ["\u0113", "\u00E9", "\u011B", "\u00E8", "e"];
        const _i = ["\u012B", "\u00ED", "\u01D0", "\u00EC", "i"];
        const _o = ["\u014D", "\u00F3", "\u01D2", "\u00F2", "o"];
        const _u = ["\u016B", "\u00FA", "\u01D4", "\u00F9", "u"];
        const _v = ["\u01D6", "\u01D8", "\u01DA", "\u01DC", "\u00FC"];

        a_pinyin = a_pinyin.split(" ");
        for (j = 0; j < a_pinyin.length; j++)
        {
            pin = a_pinyin[j];
            tone = 4;

            if (pin.indexOf("1") != - 1)
                tone = 0;
            else if (pin.indexOf("2") != - 1)
                tone = 1;
            else if (pin.indexOf("3") != - 1)
                tone = 2;
            else if (pin.indexOf("4") != - 1)
                tone = 3;

            if (pin.indexOf("a") != - 1)
                pin = pin.replace("a", _a[tone]);
            else if (pin.indexOf("e") != - 1)
                pin = pin.replace("e", _e[tone]);
            else if (pin.indexOf("ou") != - 1)
                pin = pin.replace("o", _o[tone]);
            else
            {
                for (k = pin.length - 1; k >= 0; k--)
                {
                    if (this.isVowel(pin[k]))
                    {
                        switch (pin[k])
                        {
                            case 'i':
                                pin = pin.replace("i", _i[tone]);
                                break;
                            case 'o':
                                pin = pin.replace("o", _o[tone]);
                                break;
                            case 'u':
                                if (k + 1 < pin.length - 1 && pin[k + 1] == ":")
                                    pin = pin.replace("u:", _v[tone]);
                                else
                                    pin = pin.replace("u", _u[tone]);
                                break;
                            default:
                                alert("some kind of weird vowel");
                        }
                        break;
                    }
                }
            }
            a_pinyin[j] = pin.substring(0, pin.length - 1);
            // strip the number
        }
        return a_pinyin.join(" ");
    },

    /**
     * test whether a letter is a vowel or not
     * 
     * @param {String} a_letter        letter to test
     * 
     * @return true if a vowel, else false
     * @type boolean
     */
    isVowel: function(a_letter)
    {
        return (   a_letter == "a"
                || a_letter == "e"
                || a_letter == "i"
                || a_letter == "o"
                || a_letter == "u");
    },

    /**
     * look up string in dictionary
     * 
     * The function tries to find the string and initial substrings using
     * both traditional and simplified character indexes.  If nothing is
     * found, the function tries to find the first character in the hanzi
     * data file.  If nothing is found there, the function will return
     * an <unknown> element.
     * @param {Alph.SourceSelection} a_alphtarget object containing the selected word and context 
     *                                        as returned by {@link Alph.LanguageTool#findSelection}
     *
     * @return dictionary entry in XML format (following lexicon schema)
     *         or -1 in case of lookup error
     *         
     */
    lookup: function(a_alphtarget)
    {
        // results array
        var rs = [];

        // prepare for lookup loop
        // because only context forward is set,
        // the selected char will always be at position 0
        cpWord = a_alphtarget.getContext();
        count = 0;
        format = "simp";
        var lines;

        // for each initial substring of word
        // For now, don't check single characters - use hanzi data instead
        // To enable single-char dictionary entries,
        // use test "cpWord.length > 0"
        while (cpWord.length > 1)
        {
            // add comma to force exact match in index
            cpWord += ",";

            // if last successful lookup was simplified
            if (format == "simp")
            {
                lines = this.findData(this.wordIndexSimp, cpWord);
                if (!lines)
                {
                    // if simplified failed, try traditional
                    lines = this.findData(this.wordIndexTrad, cpWord);
                    if (lines)
                        format = "trad";
                }
            }
            // if last successful lookup was traditional
            else
            {
                lines = this.findData(this.wordIndexTrad, cpWord);
                if (!lines)
                {
                    // if traditional failed, try simplified
                    lines = this.findData(this.wordIndexSimp, cpWord);
                    if (lines)
                        format = "simp";
                }
            }

            // if entry found
            if (lines)
            {
                offset = 0;
// For now, only use first entry
// Many repeat entries are essentially but not exactly identical
// hence check below for duplicates does not eliminate them
// To enable processing of all lines, uncomment the following line:
//              while (offset < lines.length)
                {
                    // get next line
                    nextOffset = lines.indexOf('\n', offset) + 1;
                    if (nextOffset == 0)
                        nextOffset = lines.length;
                    line = lines.substring(offset, nextOffset);

                    // offset in dictionary follows comma in index line
                    dictOffset = line.substr(line.indexOf(",") + 1);
                    if (dictOffset > this.wordDict.length)
                    {
                        // sanity check
                        alert(  "dictionary index error, tried to pull entry "
                              & dictOffset
                              & " from an array size of "
                              & this.wordDict.length);
                        return -1;
                    }

                    // remember dictionary entry
                    rs[count++] = this.wordDict.substring(
                                        dictOffset,
                                        this.wordDict.indexOf("\n", dictOffset));

                    // go to next line
                    offset = nextOffset;
                }
            }

            // shorten word by removing last character (and comma we added)
            cpWord = cpWord.substring(0, cpWord.length - 2);
        }

        // as of now dictionary has lots of exact duplicates, eliminate them
        for (i = 0; i < count; i++)
        {
            if (rs[i])
            {
                for (j = i + 1; j < count; j++)
                {
                    if (rs[i] == rs[j])
                        rs[j] = null;
                }
            }
        }

        // start output
        var xmlOut;
        if (count > 0)
            xmlOut = "<word>";

        // for each dictionary entry
        for (i = 0; i < count; i++)
        {
            // skip eliminated duplicates
            entry = rs[i];
            if (!entry)
                continue;

            // extract dictionary entry
            firstBlank = entry.indexOf(" ", 0);
            if (format == "trad")
                hanzi = entry.substring(0, firstBlank);
            else
            {
                hanzi = entry.substring(
                            firstBlank + 1,
                            entry.indexOf(" ", firstBlank + 1));
            }

            // extract pinyin
            pinyin = entry.substring(entry.indexOf("[", 0) + 1,
                                     entry.indexOf("]", 0));

            // have to add spaces because adso doesn't have them
            pCopy = "";
            for (w = 0; w < pinyin.length; w++)
            {
                pCopy += pinyin[w];
                if ((0 <= pinyin[w]) && (pinyin[w] <= 5))
                    pCopy += " ";
            }
            if (pCopy[pCopy.length - 1] == ' ')
                pCopy = pCopy.substring(0, pCopy.length - 1);

            // switch numbers to tone marks
            pinyin = this.formatPinyin(pCopy);

            // format definition
            def = entry.substring(entry.indexOf("/", 0) + 1, entry.length);
            def = def.replace(/\//g, ", ");
            def = def.substring(0, def.length - 3);

            // add this entry to output
            xmlOut += "<entry>"
                   +    "<dict>"
                   +      "<hdwd>" + hanzi + "</hdwd>"
                   +      "<pron>" + pinyin + "</pron>"
                   +    "</dict>"
                   +    "<mean>" + def + "</mean>"
                   +  "</entry>";
        }

        // add character info
        hanziOut = this.hanziInfo(a_alphtarget.getWord());
        if (hanziOut.length)
        {
            if (count == 0)
                xmlOut = "<word>";
            xmlOut += hanziOut;
        }
        else
            return "<unknown>" + a_alphtarget.getWord() + "</unknown>";

        // terminate output
        xmlOut += "</word>";

        return xmlOut;
    },

    /**
     *  convert Unicode character to Uxxxx representation
     *
     * @param {String} a_c         character to convert
     * 
     * @return converted value
     * @type String
     */
    unicodeInfo: function(a_c)
    {
        const hex = "0123456789ABCDEF";
        const u = a_c.charCodeAt(0);
        return   "U+"
               + hex[(u >>> 12) & 15]
               + hex[(u >>> 8) & 15]
               + hex[(u >>> 4) & 15]
               + hex[u & 15];
    },

    /**
     * convert radical index (1 to 214) to character
     * 
     * There is a CJK radical character set in Unicode (U+2F00 to U+2FD5)
     * but many fonts do not have glyphs for these characters.
     * 
     * @param int a_radical       index of radical
     * 
     * @return Unicode character for radical
     * @type String
     */
    radicalIndexToChar: function(a_radical)
    {
        const traditionalCodes =
        [
            0x0000,         // dummy for index 0
            0x4E00, 0x4E28, 0x4E36, 0x4E3F, 0x4E59, 0x4E85, 0x4E8C, 0x4EA0,
            0x4EBA, 0x513F, 0x5165, 0x516B, 0x5182, 0x5196, 0x51AB, 0x51E0,
            0x51F5, 0x5200, 0x529B, 0x52F9, 0x5315, 0x531A, 0x5338, 0x5341,
            0x535C, 0x5369, 0x5382, 0x53B6, 0x53C8, 0x53E3, 0x56D7, 0x571F,
            0x58EB, 0x5902, 0x590A, 0x5915, 0x5927, 0x5973, 0x5B50, 0x5B80,
            0x5BF8, 0x5C0F, 0x5C22, 0x5C38, 0x5C6E, 0x5C71, 0x5DDB, 0x5DE5,
            0x5DF1, 0x5DFE, 0x5E72, 0x5E7A, 0x5E7F, 0x5EF4, 0x5EFE, 0x5F0B,
            0x5F13, 0x5F50, 0x5F61, 0x5F73, 0x5FC3, 0x6208, 0x6236, 0x624B,
            0x652F, 0x6534, 0x6587, 0x6597, 0x65A4, 0x65B9, 0x65E0, 0x65E5,
            0x66F0, 0x6708, 0x6728, 0x6B20, 0x6B62, 0x6B79, 0x6BB3, 0x6BCB,
            0x6BD4, 0x6BDB, 0x6C0F, 0x6C14, 0x6C34, 0x706B, 0x722A, 0x7236,
            0x723B, 0x723F, 0x7247, 0x7259, 0x725B, 0x72AC, 0x7384, 0x7389,
            0x74DC, 0x74E6, 0x7518, 0x751F, 0x7528, 0x7530, 0x758B, 0x7592,
            0x7676, 0x767D, 0x76AE, 0x76BF, 0x76EE, 0x77DB, 0x77E2, 0x77F3,
            0x793A, 0x79B8, 0x79BE, 0x7A74, 0x7ACB, 0x7AF9, 0x7C73, 0x7CF8,
            0x7F36, 0x7F51, 0x7F8A, 0x7FBD, 0x8001, 0x800C, 0x8012, 0x8033,
            0x807F, 0x8089, 0x81E3, 0x81EA, 0x81F3, 0x81FC, 0x820C, 0x821B,
            0x821F, 0x826E, 0x8272, 0x8278, 0x864D, 0x866B, 0x8840, 0x884C,
            0x8863, 0x897E, 0x898B, 0x89D2, 0x8A00, 0x8C37, 0x8C46, 0x8C55,
            0x8C78, 0x8C9D, 0x8D64, 0x8D70, 0x8DB3, 0x8EAB, 0x8ECA, 0x8F9B,
            0x8FB0, 0x8FB5, 0x9091, 0x9149, 0x91C6, 0x91CC, 0x91D1, 0x9577,
            0x9580, 0x961C, 0x96B6, 0x96B9, 0x96E8, 0x9751, 0x975E, 0x9762,
            0x9769, 0x97CB, 0x97ED, 0x97F3, 0x9801, 0x98A8, 0x98DB, 0x98DF,
            0x9996, 0x9999, 0x99AC, 0x9AA8, 0x9AD8, 0x9ADF, 0x9B25, 0x9B2F,
            0x9B32, 0x9B3C, 0x9B5A, 0x9CE5, 0x9E75, 0x9E7F, 0x9EA5, 0x9EBB,
            0x9EC3, 0x9ECD, 0x9ED1, 0x9EF9, 0x9EFD, 0x9F0E, 0x9F13, 0x9F20,
            0x9F3B, 0x9F4A, 0x9F52, 0x9F8D, 0x9F9C, 0x9FA0
        ];

        const simplifiedCodes =
        [
            0x0000,         // dummy for index 0
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x4E2C, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x7E9F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x89C1, 0x89D2, 0x8BA0, 0x003F, 0x003F, 0x003F,
            0x003F, 0x8D1D, 0x003F, 0x003F, 0x003F, 0x003F, 0x8F66, 0x003F,
            0x003F, 0x8FB6, 0x003F, 0x003F, 0x003F, 0x003F, 0x9485, 0x957F,
            0x95E8, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x97E6, 0x003F, 0x003F, 0x9875, 0x98CE, 0x98DE, 0x9963,
            0x003F, 0x003F, 0x9A6C, 0x003F, 0x003F, 0x003F, 0x003F, 0x003F,
            0x003F, 0x003F, 0x9C7C, 0x9E1F, 0x9E75, 0x003F, 0x9EA6, 0x003F,
            0x9EC4, 0x003F, 0x003F, 0x003F, 0x9EFE, 0x003F, 0x003F, 0x003F,
            0x003F, 0x9F50, 0x9F7F, 0x9F99, 0x9F9F, 0x003F
        ];

        // if last char is quote, this is simplified radical
        traditional = true;
        if (a_radical[a_radical.length - 1] == "'")
        {
            a_radical = a_radical.substr(0, a_radical.length - 1);
            traditional = false;
        }

        if ((0 < a_radical) && (a_radical <= 214))
        {
            if (traditional)
                return String.fromCharCode(traditionalCodes[a_radical]);
            else
                return String.fromCharCode(simplifiedCodes[a_radical]);
        }

        return '?';
    },

    /**
     * do linear search in file
     *
     * @param {String} a_data          data to search
     * @param {String} a_key           key to search for
     *
     * @return remainder of line following key, or empty string if key not found
     * @type String
     */
    linearSearch: function(a_data, a_key)
    {
        fi = a_data.indexOf(a_key);
        if (fi == - 1)
            return "";

        text = a_data.substring(fi + a_key.length,
                                a_data.indexOf("\n", fi));

        // strip trailing carriage return or blank
        if ((text[text.length - 1] == '\r') ||
            (text[text.length - 1] == ' '))
        {
            text = text.substr(0, text.length - 1);
        }

        return text;
    },


    /**
     * find information on hanzi character
     *
     * @param {String} a_hanzi     character to find info for
     * 
     * @return info in XML format (following lexicon schema)
     *         or empty string if not found
     * @type String
     */
    hanziInfo: function(a_hanzi)
    {
        // find lines matching this character
        unicode = this.unicodeInfo(a_hanzi);
        lines = this.findData(this.hanziData, unicode + '\t');
        if (!lines)
            return "";

        total = 0;

        // Mandarin pronunciation
        mand = this.linearSearch(lines, "\tkMandarin\t");
        mand = this.formatPinyin(mand.toLowerCase());
        total += mand.length;

        // Total stroke count
        stroke = 0;
//      stroke = this.linearSearch(lines, "\tkTotalStrokes\t");
        total += stroke.length;

        // Definition
        def = this.linearSearch(lines, "\tkDefinition\t");
        total += def.length;

        // Cantonese pronunciation
        cant = this.linearSearch(lines, "\tkCantonese\t");
        total += cant.length;

        // Tang pronunciation
        tang = this.linearSearch(lines, "\tkTang\t");
        total += tang.length;

        // Frequency
        freq = this.linearSearch(lines, "\tkFrequency\t");
        total += freq.length;

        // Radical/stroke
        rstr = this.linearSearch(lines, "\tkRSUnicode\t");
        total += rstr.length;

        // if no useful info, return failure
        if (total == 0)
            return "";

        xmlOut = "<entry><dict>";
        xmlOut += "<hdwd>" + a_hanzi + "</hdwd>";
        if (mand.length > 0)
            xmlOut += "<pron>" + mand + "</pron>";
        if (cant.length > 0)
            xmlOut += "<pron>Cantonese " + cant + "</pron>";
        if (tang.length > 0)
            xmlOut += "<pron>Tang " + tang + "</pron>";
        if (stroke.length > 0)
            xmlOut += "<note>Stroke count " + stroke + "</note>";
        if (rstr.length > 0)
        {
            // split first radical.stroke
            firstRstr = rstr.split(" ")[0].split(".");
            xmlOut += "<note>Radical " +
                      this.radicalIndexToChar(firstRstr[0]) +
                      " (" + rstr + ")" +
                      "</note>";
        }
        if (freq.length > 0)
        {
            const freqName =
            [
                "least frequent",
                "less frequent",
                "moderately frequent",
                "more frequent",
                "most frequent"
            ];

            // invert frequency order
            freq = 6 - freq;
            if ((1 <= freq) && (freq <= 5))
            {
                xmlOut += "<freq" +
// For now, don't include order attribute because it causes these entries
// to appear before dictionary entries
//                        " order=\"" + freq + "\""
                          ">" +
                          freqName[freq - 1] +
                          "</freq>";
            }
        }
        xmlOut += "</dict>";
        if (def.length > 0)
            xmlOut += "<mean>" + def + "</mean>";
        xmlOut += "</entry>";

        return xmlOut;
    }
};
