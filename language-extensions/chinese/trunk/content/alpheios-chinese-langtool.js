/**
 * @fileoverview Chinese extension of Alph.LanguageTool class
 * @version $Id$
 * Copyright 2008-2010 Cantus Foundation
 * http://alpheios.net
 * 
 * Based upon PeraPera-Kun
 * A modded version of Rikai-Chan by Justin Kovalchuk
 * Original Author: Jonathan Zarate
 * Copyright (C) 2005-2006 
 * http://www.polarcloud.com/
 * 
 * Based on rikaiXUL 0.4 by Todd Rudick
 * http://rikaixul.mozdev.org/
 * 
 * This file is part of Alpheios.
 * 
 * Alpheios is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alpheios is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */ 

Alph.LanguageToolFactory.addLang('chinese','LanguageTool_Chinese');

/**
 * @class  Alph.LanguageTool_Chinese extends {@link Alph.LanguageTool} 
 * @extends Alph.LanguageTool
 * @param {String} a_language  the source language for this instance
 * @param {Properties} a_properties additional properties to set as private members of 
 *                                  the object (accessor methods will be dynamically created)
 */
Alph.LanguageTool_Chinese = function(a_lang, props) 
{ 
    Alph.LanguageTool.call(this,a_lang,{});
};

/**
 * @ignore
 */
Alph.LanguageTool_Chinese.prototype = new Alph.LanguageTool();

/**
 * Chinese specific startup method in the derived instance which
 * loads the dictionary files. Called by the derived instance
 * keyed by the preference setting 'extensions.alpheios.chinese.methods.startup'. 
 * @returns true if successful, otherwise false
 * @type boolean
 */
Alph.LanguageTool_Chinese.prototype.loadDictionary = function()
{
    try
    {
        this.d_dictionary = new Alph.ChineseDict(false);
        this.s_logger.debug("Loaded Chinese dictionary");
    }
    catch (ex)
    {
        alert("error loading dictionary: " + ex);
        return false;
    }
    return true;  
};

/**
 * Chinese-specific method to lookup selection in the dictionary 
 * Called by the derived instance of {@link Alph.LanguageTool#lexiconLookup}, 
 * keyed by the preference setting 'extensions.alpheios.chinese.methods.lexicon'
 * @see Alph.LanguageTool#lexiconLookup
 */
Alph.LanguageTool_Chinese.prototype.lookupDictionary = 
function(a_alphtarget,a_onsuccess,a_onerror)
{
    var data = 
        this.d_dictionary.lookup(a_alphtarget);
    if (typeof data != "undefined")
    {
        a_onsuccess(data);
    }
    else
    {
        //TODO replace this with actual error
        a_onerror("CHINESE ERROR")
    }
}

/**
 * Chinese-specific implementation of {@link Alph.LanguageTool#postTransform}.
 * Applies the lang attribute to the alph-hdwd and alph-mean tags.
 * TODO - this should be handled in the lexicon schema and xsl stylesheet
 */
Alph.LanguageTool_Chinese.prototype.postTransform = function(a_node)
{
    Alph.$(".alph-hdwd",a_node).attr("lang",Alph.BrowserUtils.getPref("languagecode",this.source_language));
    Alph.$(".alph-mean",a_node).attr("lang",'en');

}