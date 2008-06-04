/**
 * @fileoverview Chinese extension of Alph.LanguageTool class
 * @version $Id$
 */

/**
 * @class  Alph.LanguageToolSet.chinese extends {@link Alph.LanguageTool} to define 
 * Chinese-specific functionality for the alpheios extension.
 * 
 * @constructor 
 * @param {String} a_language  the source language for this instance
 * @param {Properties} a_properties additional properties to set as private members of 
 *                                  the object (accessor methods will be dynamically created)
 * @see Alph.LanguageTool
 */
Alph.LanguageToolSet.chinese = function(a_lang, props) 
{ 
    Alph.LanguageTool.call(this,a_lang,{});
};

/**
 * @ignore
 */
Alph.LanguageToolSet.chinese.prototype = new Alph.LanguageTool();

/**
 * Flag to indicate that this class extends Alph.LanguageTool.
 * (Shouldn't be necessary but because they are not packaged in the same extension
 * the instanceof operator won't work.)
 * @type boolean
 */
Alph.LanguageToolSet.chinese.implementsAlphLanguageTool = true;

/**
 * Chinese specific startup method in the derived instance which
 * loads the dictionary files. Called by the derived instance
 * keyed by the preference setting 'extensions.alpheios.chinese.methods.startup'. 
 * @returns true if successful, otherwise false
 * @type boolean
 */
Alph.LanguageToolSet.chinese.prototype.loadDictionary = function()
{
    try
    {
        this.dictionary = new Alph.ChineseDict(false);
        Alph.util.log("Loaded Chinese dictionary");
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
Alph.LanguageToolSet.chinese.prototype.lookupDictionary = 
function(a_alphtarget,a_onsuccess,a_onerror)
{
    var data = 
        this.dictionary.lookup(a_alphtarget);
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
Alph.LanguageToolSet.chinese.prototype.postTransform = function(a_node)
{
    $(".alph-hdwd",a_node).attr("lang",Alph.util.getPref("languagecode",this.source_language));
    $(".alph-mean",a_node).attr("lang",'en');

}