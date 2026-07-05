import { useTranslation } from 'react-i18next';
import { LANGUAGE_MAP, type SupportedLanguage } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLang = (i18n.language?.split('-')[0] || 'en') as SupportedLanguage;

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={currentLang} onValueChange={handleChange}>
        <SelectTrigger className="w-[160px] h-9 text-xs border-border/40 bg-background/50 hover:bg-background/80 transition-colors">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{LANGUAGE_MAP[currentLang]?.flag}</span>
              <span>{LANGUAGE_MAP[currentLang]?.nativeLabel}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(LANGUAGE_MAP) as [SupportedLanguage, typeof LANGUAGE_MAP[SupportedLanguage]][]).map(
            ([code, lang]) => (
              <SelectItem key={code} value={code} className="text-sm">
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.nativeLabel}</span>
                  <span className="text-muted-foreground text-xs ml-1">({lang.label})</span>
                </span>
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
