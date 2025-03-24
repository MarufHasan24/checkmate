let key = "IOt0opzjmObdTqewC/FGm5PHNmV+7QuhbHmox5bpfFE=";
let data = JSON.parse(localStorage.getItem(key) || null);
let adminInfo = localStorage.getItem("admin")?.split(",") || [];
const appDiv = document.getElementById("app");
const searchBox = document.getElementById("search-box");
const languageSelect = document.getElementById("language-select");
const hostname = document.getElementById("hostname");
const navContainer = document.getElementById("nav-container");
const languages = {
  en: "English - English",
  es: "Español - Spanish",
  fr: "Français - French",
  de: "Deutsch - German",
  zh: "中文 - Chinese",
  ru: "Русский - Russian",
  ar: "العربية - Arabic",
  hi: "हिन्दी - Hindi",
  bn: "বাংলা - Bangla",
  pt: "Português - Portuguese",
  ja: "日本語 - Japanese",
  ko: "한국어 - Korean",
  vi: "Tiếng Việt - Vietnamese",
  it: "Italiano - Italian",
  pl: "Polski - Polish",
  uk: "Українська - Ukrainian",
  fa: "فارسی - Persian",
  ur: "اردو - Urdu",
  he: "עברית - Hebrew",
  th: "ไทย - Thai",
  nl: "Nederlands - Dutch",
  sv: "Svenska - Swedish",
  fi: "Suomi - Finnish",
  no: "Norsk - Norwegian",
  da: "Dansk - Danish",
  tr: "Türkçe - Turkish",
  el: "Ελληνικά - Greek",
  hu: "Magyar - Hungarian",
  cs: "Čeština - Czech",
  ro: "Română - Romanian",
  id: "Bahasa Indonesia - Indonesian",
  ms: "Bahasa Melayu - Malay",
  tl: "Tagalog - Tagalog",
  ta: "தமிழ் - Tamil",
  te: "తెలుగు - Telugu",
  mr: "मराठी - Marathi",
  gu: "ગુજરાતી - Gujarati",
  kn: "ಕನ್ನಡ - Kannada",
  ml: "മലയാളം - Malayalam",
  si: "සිංහල - Sinhala",
  ne: "नेपाली - Nepali",
  my: "မြန်မာဘာသာ - Burmese",
  km: "ភាសាខ្មែរ - Khmer",
  lo: "ລາວ - Lao",
  jw: "Basa Jawa - Javanese",
  su: "Basa Sunda - Sundanese",
  ceb: "Cebuano - Cebuano",
  war: "Winaray - Waray",
  ht: "Kreyòl Ayisyen - Haitian Creole",
  haw: "ʻŌlelo Hawaiʻi - Hawaiian",
  mi: "Māori - Maori",
  sm: "Gagana Samoa - Samoan",
  to: "Lea faka-Tonga - Tongan",
  fj: "Vosa Vakaviti - Fijian",
  ty: "Reo Tahiti - Tahitian",
  mg: "Malagasy - Malagasy",
  yo: "Yorùbá - Yoruba",
  ig: "Igbo - Igbo",
  zu: "isiZulu - Zulu",
  xh: "isiXhosa - Xhosa",
  st: "Sesotho - Sotho",
  tn: "Setswana - Tswana",
  sn: "chiShona - Shona",
  ny: "Chichewa - Chichewa",
  rw: "Kinyarwanda - Kinyarwanda",
  lg: "Luganda - Ganda",
  ha: "Hausa - Hausa",
  so: "Soomaali - Somali",
  sw: "Kiswahili - Swahili",
  am: "አማርኛ - Amharic",
  ti: "ትግርኛ - Tigrinya",
  om: "Oromoo - Oromo",
  be: "Беларуская - Belarusian",
  bg: "Български - Bulgarian",
  kk: "Қазақша - Kazakh",
  ky: "Кыргызча - Kyrgyz",
  uz: "Oʻzbekcha - Uzbek",
  tg: "Тоҷикӣ - Tajik",
  mn: "Монгол - Mongolian",
  bo: "བོད་སྐད་ - Tibetan",
  dz: "རྫོང་ཁ་ - Dzongkha",
  ka: "ქართული - Georgian",
  hy: "Հայերեն - Armenian",
  az: "Azərbaycan dili - Azerbaijani",
  eu: "Euskara - Basque",
  gl: "Galego - Galician",
  ca: "Català - Catalan",
  cy: "Cymraeg - Welsh",
  ga: "Gaeilge - Irish",
  gd: "Gàidhlig - Scottish Gaelic",
  br: "Brezhoneg - Breton",
  fy: "Frysk - Frisian",
  is: "Íslenska - Icelandic",
  lb: "Lëtzebuergesch - Luxembourgish",
  mt: "Malti - Maltese",
  sq: "Shqip - Albanian",
  mk: "Македонски - Macedonian",
  sr: "Српски - Serbian",
  bs: "Bosanski - Bosnian",
  hr: "Hrvatski - Croatian",
  sl: "Slovenščina - Slovenian",
  sh: "Srpskohrvatski - Serbo-Croatian",
  et: "Eesti - Estonian",
  lv: "Latviešu - Latvian",
  lt: "Lietuvių - Lithuanian",
  yi: "ייִדיש - Yiddish",
  la: "Latina - Latin",
  co: "Corsu - Corsican",
  gv: "Gaelg - Manx",
  kw: "Kernewek - Cornish",
  ang: "Ænglisc - Old English",
  non: "Norrǿna - Old Norse",
  got: "𐌲𐌿𐍄𐌹𐍃𐌺 - Gothic",
  cu: "Ѩзыкъ словѣньскъ - Old Church Slavonic",
  sa: "संस्कृतम् - Sanskrit",
  pi: "पालि - Pali",
  pa: "ਪੰਜਾਬੀ - Punjabi",
  sd: "سنڌي - Sindhi",
  ps: "پښتو - Pashto",
  ku: "Kurdî - Kurdish",
  ckb: "سۆرانی - Sorani",
  zza: "Zazaki - Zaza",
  diq: "Dimli - Dimli",
  kmr: "Kurmancî - Kurmanji",
  lrc: "لۊری شومالی - Northern Luri",
  glk: "گیلکی - Gilaki",
  mzn: "مازِرونی - Mazanderani",
  tk: "Türkmençe - Turkmen",
  tt: "Татарча - Tatar",
  ba: "Башҡортса - Bashkir",
  cv: "Чӑвашла - Chuvash",
  sah: "Саха тыла - Yakut",
  udm: "Удмурт кыл - Udmurt",
  kbd: "Адыгэбзэ - Kabardian",
  ady: "Адыгэбзэ - Adyghe",
  ab: "Аҧсуа - Abkhaz",
  os: "Ирон - Ossetian",
  av: "Авар - Avar",
  lez: "Лезги - Lezgian",
  ce: "Нохчийн - Chechen",
  inh: "ГӀалгӀай - Ingush",
  krc: "Къарачай-Малкъар - Karachay-Balkar",
  lbe: "Лакку - Lak",
  dar: "Дарган - Dargwa",
  tab: "Табасаран - Tabasaran",
  rut: "МыхаӀбишды - Rutul",
  tkr: "ЦӀаӀхна - Tsakhur",
  agx: "Агъул - Agul",
  xal: "Хальмг - Kalmyk",
  bxr: "Буряад - Buryat",
  tyv: "Тыва дыл - Tuvan",
  alt: "Алтай тил - Altai",
  kjh: "Хакас - Khakas",
  chm: "Марий йылме - Mari",
  mhr: "Олык марий - Eastern Mari",
  mrj: "Кырык мары - Western Mari",
  udm: "Удмурт кыл - Udmurt",
  koi: "Перем коми - Komi-Permyak",
  kpv: "Коми - Komi",
  myv: "Эрзянь кель - Erzya",
  mdf: "Мокшень кяль - Moksha",
  nio: "Нганасан - Nganasan",
  sel: "Селькуп - Selkup",
  kca: "Ханты - Khanty",
  mns: "Манси - Mansi",
  sjd: "Кӣллт са̄мь - Kildin Sami",
  sma: "Åarjelsaemien - Southern Sami",
  smj: "Julevsámegiella - Lule Sami",
  sms: "Sääʹmǩiõll - Skolt Sami",
  sje: "Saemien - Pite Sami",
  sju: "Ume Sami - Ume Sami",
  smn: "Anarâškielâ - Inari Sami",
  sia: "Åarjelsaemien - Southern Sami",
  sjd: "Кӣллт са̄мь - Kildin Sami",
  sjk: "Kemi Sami - Kemi Sami",
  sjt: "Ter Sami - Ter Sami",
  sju: "Ume Sami - Ume Sami",
  smn: "Anarâškielâ - Inari Sami",
  sms: "Sääʹmǩiõll - Skolt Sami",
  sma: "Åarjelsaemien - Southern Sami",
  smj: "Julevsámegiella - Lule Sami",
  sje: "Saemien - Pite Sami",
  sju: "Ume Sami - Ume Sami",
  smn: "Anarâškielâ - Inari Sami",
  sms: "Sääʹmǩiõll - Skolt Sami",
  sma: "Åarjelsaemien - Southern Sami",
  smj: "Julevsámegiella - Lule Sami",
  sje: "Saemien - Pite Sami",
  sju: "Ume Sami - Ume Sami",
  smn: "Anarâškielâ - Inari Sami",
  sms: "Sääʹmǩiõll - Skolt Sami",
  sma: "Åarjelsaemien - Southern Sami",
  smj: "Julevsámegiella - Lule Sami",
  sje: "Saemien - Pite Sami",
  sju: "Ume Sami - Ume Sami",
  smn: "Anarâškielâ - Inari Sami",
  sms: "Sääʹmǩiõll - Skolt Sami",
  sma: "Åarjelsaemien - Southern Sami",
  smj: "Julevsámegiella - Lule Sami",
  sje: "Saemien - Pite Sami",
  sju: "Ume Sami - Ume Sami",
  smn: "Anarâškielâ - Inari Sami",
};
let user = {};
//let's go
window.onload = () => {
  const signInButton = document.getElementById("signIn");
  const signUpButton = document.getElementById("signUp");
  const container = document.getElementById("container");
  const signContainer = document.getElementById("signincontainer");
  if (data || apiuser) {
    if (data) localStorage.setItem(key, JSON.stringify(data));
    let langCode = localStorage.getItem("langcode");
    searchBox.value = languages[langCode || "en"];
    searchBox.langCode = langCode || "en";
    //user is logged in
    console.log(langCode);
    updateLangdata({
      langcode: langCode,
      username: data.username,
    });
    /* onclick change class */
    signInButton.addEventListener("click", () => {
      container.classList.add("right-panel-active");
    });

    // list of templates
    document.querySelector("#host").onclick = (e) => {
      e.preventDefault();
      let langcode = document
        .querySelector("#customLangcode")
        .value.toLowerCase();
      let project = document.querySelector("#project").value;
      let projecturl = langcode + "." + project;
      checkWikimediaAPI(projecturl, function (isValid) {
        if (isValid) {
          if (hostname.value) {
            proxyFetch(
              "template",
              {
                key: generateRandomKey(30),
                password: generateRandomKey(15),
                template: "common",
                userdata: user,
                compname: hostname.value,
                project: projecturl,
              },
              (data) => {
                if (data && data.result) {
                  location.replace("/template?data=" + data.data);
                } else {
                  //console.log("Fail Data", data)
                }
              }
            );
          } else {
            alert("Please choose a name for your compitition!");
          }
        } else {
          //alert user that its a non valid url
          alert(projecturl + " is not a valid wikimedia project");
        }
      });
    };
  } else {
    //send them to login page
    signInButton.innerHTML = "Login";
    signInButton.addEventListener("click", function () {
      location.replace("/login");
    });
    signContainer.innerHTML = "";
  }
  signUpButton.addEventListener("click", () => {
    container.classList.remove("right-panel-active");
  });
  searchBox.addEventListener("input", () => {
    updateDropdown(searchBox.value);
  });
  document.querySelector("#search").onclick = (e) => {
    e.preventDefault();
    let key = document.getElementById("searchkey"),
      name = document.getElementById("searchname"),
      host = document.getElementById("searchhost"),
      project = document.getElementById("searchproject");
    let query = new URLSearchParams({
      key: key.value || "",
      name: name.value || "",
      host: host.value || "",
      project: project.value || "",
    }).toString();
    location.replace("/query?" + query);
  };
  searchBox.addEventListener("click", () => {
    updateDropdown(searchBox.value);
  });
  document.addEventListener("click", (event) => {
    if (
      !searchBox.contains(event.target) &&
      !languageSelect.contains(event.target)
    ) {
      languageSelect.style.display = "none";
    }
  });
};

function updateDropdown(filter = "") {
  languageSelect.innerHTML = "";
  const filteredLanguages = Object.entries(languages).filter(([code, name]) =>
    name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredLanguages.length === 0) {
    languageSelect.style.display = "none";
    return;
  }

  filteredLanguages.forEach(([code, name]) => {
    const div = document.createElement("div");
    div.classList.add("language-option");
    div.textContent = name;
    div.onclick = () => {
      searchBox.value = name;
      searchBox.langCode = code;
      localStorage.setItem("langcode", code);
      updateLangdata({
        langcode: code,
        username: data?.username || null,
      });
      languageSelect.style.display = "none";
    };
    languageSelect.appendChild(div);
  });
  languageSelect.style.display = "block";
}

//generate random keys and pass for user
function generateRandomKey(len) {
  const timestamp = Date.now().toString(36);
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  function randomString(length) {
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }
  const randomPartLength = len - timestamp.length;
  const randomPart = randomString(randomPartLength);
  const randomKey = split(randomPart, timestamp);
  function split(value, elem) {
    let index = Math.floor(Math.random() * value.length);
    return value.substring(0, index) + elem + value.substring(index);
  }
  return randomKey;
}

//check api validity
function checkWikimediaAPI(projecturl, callback) {
  const url = `https://${projecturl}.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*`;
  console.log(url);
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      if (data && data.query && data.query.general) {
        // Valid API
        callback(true);
      } else {
        // Invalid API
        callback(false);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      callback(false); // In case of any error, consider it invalid
    });
}

function updateLangdata(data) {
  proxyFetch(
    "language",
    {
      langcode: data.langcode,
      user: data.username,
    },
    (fdata) => {
      if (!adminInfo.includes(data.langcode) && fdata.asAdmin) {
        adminInfo.push(langCode);
        localStorage.setItem("admin", adminInfo.join(","));
      }
      document.querySelector("#queryies tbody").innerHTML = fdata.html;
    }
  );
}
