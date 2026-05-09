
import {useLocaleStore} from "@/stores/client/locale-store";
import {translations,TranslationKeys} from "@/locale";

export const useTranslation =<K extends TranslationKeys> (fileName:K) =>{
    const locale = useLocaleStore((state) => state.locale);
    return translations[locale][fileName] as typeof translations['mm'][K];
}
