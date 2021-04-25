import i18nModule from "i18next"
import { default as i18nextXHRBackend }  from 'i18next-xhr-backend';
import LngDetector from 'i18next-browser-languagedetector';
import LanguageJOSN from "./temporary/cache/languages"
function lngPathCorrection(config, i18n) {
  const { defaultLanguage, allLanguages } = config.translation;
  return function(currentRoute, currentLanguage = i18n.languages[0]) {
    if (!allLanguages.includes(currentLanguage)) {
      return currentRoute;
    }
  
    let href = currentRoute;
    let as = href;
  
    for (const lng of allLanguages) {
      if (href.startsWith(`/${lng}/`)) {
        href = href.replace(`/${lng}/`, '/');
        break;
      }
    }
    if (currentLanguage !== defaultLanguage) {
      if(!href.startsWith("/"+currentLanguage)){
        as = `/${currentLanguage}${href}`;
        href += `?lng=${currentLanguage}`;
      }
    } else {
      as = href;
    }
  
    return [href, as];
  }
}

function makeConfig() {
  
  const DEFAULT_LANGUAGE = LanguageJOSN["default"];
  const OTHER_LANGUAGES = LanguageJOSN['others'];
  const DEFAULT_NAMESPACE = 'common';
  const LOCALE_PATH = 'public/static/locales';
  const LOCALE_STRUCTURE = '{{lng}}/{{ns}}';
  const LOCALE_SUBPATHS = true;
  /* Core Settings - only change if you understand what you're changing */
  const config = {
    translation: {
      allLanguages: OTHER_LANGUAGES.concat([DEFAULT_LANGUAGE]),
      defaultLanguage: DEFAULT_LANGUAGE,
      initImmediate:true,
      fallbackLng: DEFAULT_LANGUAGE,
      load: 'languageOnly',
      localesPath: `./${LOCALE_PATH}/`,
      debug:false,
      whitelist:OTHER_LANGUAGES.concat([DEFAULT_LANGUAGE]),
      localeSubpaths: LOCALE_SUBPATHS,
      ns: [DEFAULT_NAMESPACE],
      defaultNS: DEFAULT_NAMESPACE,
      fallbackNS:[DEFAULT_NAMESPACE],
      keySeparator:false,
      nsSeparator:false,
      preload: OTHER_LANGUAGES.concat([DEFAULT_LANGUAGE]),
      react: {
        useSuspense: false,
        omitBoundRerender: false,
      },
      cache: {
        enabled: true,
        expirationTime: 24 * 60 * 60 * 1000
      },
      interpolation: {
        escapeValue: false,
        formatSeparator: ',',
        format: function(value, format, lng) {
          if (format === "uppercase") {
            return value.toUpperCase();
          }
          if (format === "currency") {
            return new Intl.NumberFormat(lng).format(Number(value)); // under node 11, only formats in US currency
          }
          if (value instanceof Date) {
            return require("moment")(value).format(format); // @todo use lighter lib than moment
          }
          return value;
        }    
      },
      detection: {
        order: ['path', 'querystring', 'cookie'],
        caches: ['cookie'],
        cookieMinutes: 160,
        lookupQuerystring: 'lng',
        lookupFromPathIndex: 0
      },
      backend: {
        loadPath: `${(typeof window == "undefined" ? process.env.PUBLIC_URL : "")}/${LOCALE_PATH}/${LOCALE_STRUCTURE}.json`,
        //addPath: `${(typeof window == "undefined" ? process.env.PUBLIC_URL : "")}/${LOCALE_PATH}/${LOCALE_STRUCTURE}.missing.json`,
        ajax:require("axios")
      }
    },
  };
  return config
}

function getI18n(config) {
  const reactI18nextModule = require('react-i18next');
  
  // for browser use xhr backend to load translations and browser lng detector
  i18nModule
      .use(i18nextXHRBackend)
      .use(LngDetector)
      //.use(reactI18nextModule);
  if (!i18nModule.isInitialized) {
    i18nModule.init(config.translation);
  }
  i18nModule.nsFromReactTree = [];
  return i18nModule
}


function registerI18n(i18n, config) {
  return function register(Router) {
    if (config.translation.localeSubpaths) {
      i18n.on('languageChanged', lng => {
        if (process.browser) {
          const originalRoute = window.location.pathname;
          const [href, as] = lngPathCorrection(config, i18n)(originalRoute, lng);
          if (as !== originalRoute) {
            //custom routes not working
            //TO DO
           // Router.replace(href, as, { shallow: true });
          }
        }
      });
    }
  }
}

function withNs(namespaces=[]) {
  const { withTranslation } = require('react-i18next')
  i18n.nsFromReactTree = [...new Set(i18n.nsFromReactTree.concat(namespaces))];
  return withTranslation(namespaces);
}

const config = makeConfig()
const i18n = getI18n(config)
// a simple helper to getInitialProps passed on loaded i18n data
i18n.getInitialProps = (req, namespaces) => {
  if (!namespaces) namespaces = i18n.options.defaultNS;
  if (typeof namespaces === 'string') namespaces = [namespaces];

  req.i18n.toJSON = () => null; // do not serialize i18next instance and send to client

  const initialI18nStore = {};
  req.i18n.languages.forEach((l) => {
      initialI18nStore[l] = {};
      namespaces.forEach((ns) => {
          if (typeof (req.i18n.services.resourceStore.data[l]) !== 'undefined') {
              initialI18nStore[l][ns] = req.i18n.services.resourceStore.data[l][ns] || {};
          }
      });
  });

  return {
      i18n: req.i18n, // use the instance on req - fixed language on request (avoid issues in race conditions with lngs of different users)
      initialI18nStore,
      initialLanguage: req.i18n.language,
  };
};
module.exports = {
  config,
  i18n,
  registerI18n: registerI18n(i18n, config),
  withNamespaces: withNs,
}