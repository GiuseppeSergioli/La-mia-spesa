import {EN_CATALOG,EN_CATEGORIES} from './catalog-en.mjs';
import {EN_MESSAGES} from './messages-en.mjs';

export const LANGUAGE_KEY='la-mia-spesa:language:v1';
export const normalizeLanguage=value=>value==='en'?'en':'it';
export const localeFor=language=>normalizeLanguage(language)==='en'?'en-GB':'it-IT';
const dictionary={...EN_CATALOG,...EN_CATEGORIES,...EN_MESSAGES};
for(const [key,value] of Object.entries({...dictionary})){
  const lower=key.charAt(0).toLocaleLowerCase('it')+key.slice(1);
  if(!Object.hasOwn(dictionary,lower))dictionary[lower]=value.charAt(0).toLocaleLowerCase('en')+value.slice(1);
}
const regexEscape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const matcher=new RegExp(`(?<![\\p{L}\\p{N}])(?:${Object.keys(dictionary).sort((a,b)=>b.length-a.length).map(regexEscape).join('|')})(?![\\p{L}\\p{N}])`,'gu');
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decodeHtml=value=>value.replace(/&(amp|lt|gt|quot|apos|#39|#x27|nbsp|#160);/gi,(_all,key)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'",'#x27':"'",nbsp:'\u00a0','#160':'\u00a0'}[key.toLowerCase()]));

export function translateText(value,language='it') {
  const original=String(value ?? '');if(normalizeLanguage(language)==='it')return original;
  const key=original.trim().replace(/\s+/g,' ');
  const urls=[];
  const protectedText=original.replace(/https?:\/\/[^\s<>]+/g,url=>{urls.push(url);return `\uE000${urls.length-1}\uE001`;});
  let translated=Object.hasOwn(dictionary,key)?`${original.match(/^\s*/)[0]}${dictionary[key]}${original.match(/\s*$/)[0]}`:protectedText.replace(matcher,match=>dictionary[match]);
  // Only number-led joins are rewritten: place names and user input are preserved.
  translated=translated.replace(/\b(\d+) di (\d+)\b/g,'$1 of $2').replace(/\b(\d+) su (\d+)\b/g,'$1 of $2');
  translated=translated.replace(/(\d[\d.]*(?:,\d{2}))\s*€/g,(_all,amount)=>formatMoney(Math.round(Number(amount.replace(/\./g,'').replace(',','.'))*100),'en'));
  translated=translated.replace(/(\d),(\d)(?=\s*(?:kg|g|ml|l|km)\b)/g,'$1.$2');
  translated=translated.replace(/\b1 (demo stores|products|packs|stores|categories|supermarkets)\b/g,(_all,unit)=>`1 ${{'demo stores':'demo store',products:'product',packs:'pack',stores:'store',categories:'category',supermarkets:'supermarket'}[unit]}`);
  return translated.replace(/\uE000(\d+)\uE001/g,(_all,index)=>urls[Number(index)]);
}

// Translate text and accessibility labels only. Data attributes, identifiers,
// URLs, input values and markup are never used as translation targets.
export function localizeMarkup(value,language='it') {
  const html=String(value ?? '');if(normalizeLanguage(language)==='it')return html;
  const stack=[],voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  return (html.match(/<[^>]*>|[^<]+/g) || []).map(token=>{
    if(token.startsWith('<')){
      const closing=token.match(/^<\/([\w:-]+)/),opening=token.match(/^<([\w:-]+)/);
      if(closing){const tag=closing[1].toLowerCase(),index=stack.map(s=>s.tag).lastIndexOf(tag);if(index!==-1)stack.splice(index);return token;}
      if(!opening)return token;
      const tag=opening[1].toLowerCase(),skip=stack.some(s=>s.skip) || /\bdata-no-translate(?:\s|=|>)/.test(token) || tag==='script' || tag==='style';
      if(!voidTags.has(tag) && !/\/\s*>$/.test(token))stack.push({tag,skip});
      return skip?token:token.replace(/\b(aria-label|aria-valuetext|placeholder|title|alt)=("|')([\s\S]*?)\2/g,(_all,name,quote,text)=>`${name}=${quote}${escapeHtml(translateText(decodeHtml(text),language))}${quote}`);
    }
    if(stack.some(s=>s.skip))return token;
    const decoded=decodeHtml(token),translated=translateText(decoded,language);
    return decoded===translated?token:escapeHtml(translated);
  }).join('');
}

export const formatMoney=(cents,language='it')=>new Intl.NumberFormat(localeFor(language),{style:'currency',currency:'EUR'}).format(cents/100);
export const formatDistance=(km,language='it')=>`${new Intl.NumberFormat(localeFor(language),{maximumFractionDigits:1}).format(km)} km`;
export const formatDate=(value,language='it')=>new Date(value).toLocaleString(localeFor(language),{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
export const localizedProductName=(product,language='it')=>normalizeLanguage(language)==='en'?(EN_CATALOG[product.name] || product.name):product.name;
export function productMatches(product,query,language='it') {
  const term=String(query).trim().toLocaleLowerCase(localeFor(language));
  return `${product.name} ${localizedProductName(product,'en')} ${product.brand} ${translateText(product.brand,'en')} ${product.size}`.toLocaleLowerCase(localeFor(language)).includes(term);
}
