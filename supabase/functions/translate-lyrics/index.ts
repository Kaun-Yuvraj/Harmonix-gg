import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLanguage } = await req.json();
    
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid texts array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Translating ${texts.length} lines to ${targetLanguage}`);
    
    // Use MyMemory Translation API (free, no key required)
    // Translate in batches to avoid rate limits
    const translations: string[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchTranslations = await Promise.all(
        batch.map(async (text: string) => {
          try {
            // Limit text length to avoid API limits
            const truncatedText = text.slice(0, 500);
            
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncatedText)}&langpair=en|${targetLanguage}`;
            const response = await fetch(url);
            
            if (response.ok) {
              const data = await response.json();
              if (data.responseData && data.responseData.translatedText) {
                return data.responseData.translatedText;
              }
            }
            
            // If translation fails, return original
            return text;
          } catch (error) {
            console.error('Translation error for text:', text, error);
            return text;
          }
        })
      );
      
      translations.push(...batchTranslations);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('Translation complete');
    
    return new Response(
      JSON.stringify({ translations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in translate-lyrics function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to translate lyrics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
