/**
 * @fileoverview Chinese extension of Alph.LanguageTool class
 * @version $Id$
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