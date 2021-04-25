function lngPathDetector(req, res, cb) {
  const config = makeConfig();
  //return function(req, res, cb) {
  const { allLanguages, defaultLanguage } = config.translation;
  if (req.i18n) {
    const language = req.i18n.languages[0];
    /*
      If a user has hit a subpath which does not
      match their language, give preference to
      the path, and change user language.
    */
    allLanguages.forEach(lng => {
      if (req.url.startsWith(`/${lng}/`) && language !== lng) {
        req.i18n.changeLanguage(lng);
      }
    });
    /*
      If a user has hit the root path and their
      language is not set to default, give
      preference to the path and reset their
      language.
    */
    if (language !== defaultLanguage && !req.url.startsWith(`/${language}`)) {
      req.i18n.changeLanguage(defaultLanguage);
    }
    /*
      If a user has a default language prefix
      in their URL, strip it.
    */
    if (language === defaultLanguage && req.url.startsWith(`/${defaultLanguage}/`)) {
      res.redirect(301, req.url.replace(`/${defaultLanguage}/`, '/'));
    }
  }
  cb();
  //};
}


function forceTrailingSlash(config) {
  return function (req, res, cb) {
    const parseURL = require('url').parse;
    const { allLanguages } = config.translation;
    const { pathname, search } = parseURL(req.url);
    allLanguages.forEach(lng => {
      if (pathname === `/${lng}`) {
        res.redirect(301, pathname.replace(`/${lng}`, `/${lng}/`) + (search || ''));
      }
    });
    cb();
  };
}
async function readFile(path) {
  return new Promise((resolve, reject) => {
    const fs = require("fs")
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}
async function makeConfig() {
  let languages = {}
  await readFile("./temporary/cache/languages.json").then(result => {
    languages = JSON.parse(result)
    
  }).catch(err => {
    languages.default = "en"
    languages.others = []
  })

  const PORT = process.env.PORT || 5000;
  const DEFAULT_LANGUAGE = languages.default;
  const OTHER_LANGUAGES = languages.others;
  const DEFAULT_NAMESPACE = 'common';
  const LOCALE_PATH = 'public/static/locales';
  const LOCALE_STRUCTURE = '{{lng}}/{{ns}}';
  const LOCALE_SUBPATHS = true;

  /* Core Settings - only change if you understand what you're changing */
  const config = {
    port: PORT,
    translation: {
      allLanguages: OTHER_LANGUAGES.concat([DEFAULT_LANGUAGE]),
      defaultLanguage: DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      load: 'all',
      keySeparator: "",
      nsSeparator:false,
      debug: false,
      localesPath: `./${LOCALE_PATH}/`,
      localeSubpaths: LOCALE_SUBPATHS,
      ns: [DEFAULT_NAMESPACE],
      defaultNS: DEFAULT_NAMESPACE,
      interpolation: {
        escapeValue: false,
        formatSeparator: ',',
        format: (value, format) => (format === 'uppercase' ? value.toUpperCase() : value),
      },
      whitelist: OTHER_LANGUAGES.concat([DEFAULT_LANGUAGE]),
      detection: {
        order: ['path', 'querystring', 'cookie'],
        caches: ['cookie'],
        cookieMinutes: 160,
        lookupQuerystring: 'lang',
        lookupFromPathIndex: 0
      }
    },
  };

  /* SSR Settings - only change if you understand what you're changing */
  const fs = require('fs');
  const path = require('path');

  const getAllNamespaces = p => fs.readdirSync(p).map(file => file.replace('.json', ''));
  config.translation = {
    ...config.translation,
    preload: config.translation.allLanguages,
    ns: ["common"],//getAllNamespaces(`${config.translation.localesPath}${config.translation.defaultLanguage}`),
    backend: {
      loadPath: path.join(__dirname, `${LOCALE_PATH}/${LOCALE_STRUCTURE}.json`),
      //addPath: path.join(__dirname, `${LOCALE_PATH}/${LOCALE_STRUCTURE}.missing.json`),
      ajax: require("axios")
    },
  };
  return config
}

async function registerI18n(server, cb) {
  const i18next = require('i18next');
  let config = {}
  await makeConfig().then(result => {
     config = result
  }).catch(err => {
    throw err
  });
  const i18nextNodeBackend = require('i18next-node-fs-backend');
  const i18nextMiddleware = require('i18next-express-middleware');
  const i18n = i18next.default ? i18next.default : i18next;
  i18n.nsFromReactTree = [];
  const { allLanguages, localeSubpaths } = config.translation;
  i18n.use(i18nextNodeBackend)
  i18n.use(i18nextMiddleware.LanguageDetector)
  if(server)
  server.use(i18nextMiddleware.handle(i18n));
  if (localeSubpaths) {
    //server.get('*', forceTrailingSlash(config));
    //server.get(/^\/(?!_next|static).*$/, lngPathDetector);
    // server.get(`/:lng(${allLanguages.join('|')})/*`, (req, res) => {
    //   const { lng } = req.params;
    //   server.render(req, res, req.url.replace(`/${lng}`, ''), { lng });
    // });
  }

  if (!i18n.isInitialized) {
    i18n.init(config.translation, cb);
  }
  // a simple helper to getInitialProps passed on loaded i18n data
  i18n.getInitialProps = (req, namespaces) => {
    if (!namespaces) namespaces = i18n.options.defaultNS
    if (typeof namespaces === 'string') namespaces = [namespaces]

    req.i18n.toJSON = () => null // do not serialize i18next instance and send to client

    const initialI18nStore = {}
    req.i18n.languages.forEach((l) => {
      initialI18nStore[l] = {}
      namespaces.forEach((ns) => {
        initialI18nStore[l][ns] = (req.i18n.services.resourceStore.data[l] || {})[ns] || {}
      })
    })

    return {
      i18n: req.i18n, // use the instance on req - fixed language on request (avoid issues in race conditions with lngs of different users)
      initialI18nStore,
      initialLanguage: req.i18n.language
    }
  }
  //return i18n
}

module.exports = {
  registerI18n
}