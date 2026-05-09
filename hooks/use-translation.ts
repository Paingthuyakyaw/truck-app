
import {useLocaleStore} from "@/stores/client/locale-store";
import {translations,TranslationKeys} from "@/locale";

export const useTranslation = (fileName:TranslationKeys) =>{
    const locale = useLocaleStore((state) => state.locale);
    return translations[locale][fileName];
}
