import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from './locales/en-US.json';
import enGB from './locales/en-GB.json';
import ptBR from './locales/pt-BR.json';
import ptPT from './locales/pt-PT.json';
import esLA from './locales/es-LA.json';
import esES from './locales/es-ES.json';
import zhCN from './locales/zh-CN.json';
import ja from './locales/ja.json';

const resources = {
  'en-US': { translation: enUS },
  'en-GB': { translation: enGB },
  'pt-BR': { translation: ptBR },
  'pt-PT': { translation: ptPT },
  'es-LA': { translation: esLA },
  'es-ES': { translation: esES },
  'zh-CN': { translation: zhCN },
  'ja': { translation: ja },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('caderno-language') || 'en-US',
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
