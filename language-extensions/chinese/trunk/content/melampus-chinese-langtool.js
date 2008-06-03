/**
 * @fileoverview Chinese extension of MP.LanguageTool class
 * @version $Id$
 */

/**
 * @class  MP.LanguageToolSet.chinese extends {@link MP.LanguageTool} to define 
 * Chinese-specific functionality for the melampus extension.
 * 
 * @constructor 
 * @param {String} a_language  the source language for this instance
 * @param {Properties} a_properties additional properties to set as private members of 
 *                                  the object (accessor methods will be dynamically created)
 * @see MP.LanguageTool
 */
MP.LanguageToolSet.chinese = function(a_lang, props) 
{ 
    MP.LanguageTool.call(this,a_lang,{});
};

/**
 * @ignore
 */
MP.LanguageToolSet.chinese.prototype = new MP.LanguageTool();

/**
 * Flag to indicate that this class extends MP.LanguageTool.
 * (Shouldn't be necessary but because they are not packaged in the same extension
 * the instanceof operator won't work.)
 * @type boolean
 */
MP.LanguageToolSet.chinese.implementsMPLanguageTool = true;

/**
 * Chinese specific startup method in the derived instance which
 * loads the dictionary files. Called by the derived instance
 * keyed by the preference setting 'extensions.melampus.chinese.methods.startup'. 
 * @returns true if successful, otherwise false
 * @type boolean
 */
MP.LanguageToolSet.chinese.prototype.loadDictionary = function()
{
    try
    {
        this.dictionary = new MP.ChineseDict(false);
        MP.util.log("Loaded Chinese dictionary");
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
 * Called by the derived instance of {@link MP.LanguageTool#lexiconLookup}, 
 * keyed by the preference setting 'extensions.melampus.chinese.methods.lexicon'
 * @see MP.LanguageTool#lexiconLookup
 */
MP.LanguageToolSet.chinese.prototype.lookupDictionary = 
function(a_mptarget,a_onsuccess,a_onerror)
{
    var data = 
        this.dictionary.lookup(a_mptarget);
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
 * Chinese-specific implementation of {@link MP.LanguageTool#postTransform}.
 * Applies the lang attribute to the mp-hdwd and mp-mean tags.
 * TODO - this should be handled in the lexicon schema and xsl stylesheet
 */
MP.LanguageToolSet.chinese.prototype.postTransform = function(a_node)
{
    $(".mp-hdwd",a_node).attr("lang",MP.util.getPref("languagecode",this.source_language));
    $(".mp-mean",a_node).attr("lang",'en');

}