// Adds the "suspendedAccount" translation block to en/fr/kin JSON files (preserves CRLF)
const fs = require("fs");
const path = require("path");

const blocks = {
  en: {
    title: "Your Account Has Been Suspended",
    message:
      "We're sorry, but your account has been suspended. You will not be able to sign in until this is resolved.",
    accountLabel: "Account",
    whatNow: "What happens now?",
    whatNowDesc:
      "Your access has been restricted. If you believe this is a mistake, please contact our support team and we will review your account.",
    contactSupport: "Contact Support",
    contactInfo: "Support Team",
    contactPage: "Visit Contact Page",
    tryAgain: "Try Signing In Again",
    backHome: "Back to Home",
  },
  fr: {
    title: "Votre compte a \u00e9t\u00e9 suspendu",
    message:
      "Nous sommes d\u00e9sol\u00e9s, mais votre compte a \u00e9t\u00e9 suspendu. Vous ne pourrez pas vous connecter tant que ce probl\u00e8me n'est pas r\u00e9solu.",
    accountLabel: "Compte",
    whatNow: "Que se passe-t-il maintenant ?",
    whatNowDesc:
      "Votre acc\u00e8s a \u00e9t\u00e9 restreint. Si vous pensez qu'il s'agit d'une erreur, contactez notre \u00e9quipe de support et nous examinerons votre compte.",
    contactSupport: "Contacter le support",
    contactInfo: "\u00c9quipe de support",
    contactPage: "Page de contact",
    tryAgain: "R\u00e9essayer de se connecter",
    backHome: "Retour \u00e0 l'accueil",
  },
  kin: {
    title: "Konti yawe yahagaritswe",
    message:
      "Tubabariye, ariko konti yawe yahagaritswe. Ntuzashobora kwinjira kugeza igihe iki kibazo gikemutse.",
    accountLabel: "Konti",
    whatNow: "Biki bikurikira?",
    whatNowDesc:
      "Uburenganzira bwawe bwagarukijwe. Niba utekereza ko ari amakosa, twandikire itsinda ryacu ry'ubufasha ngo dusuzume konti yawe.",
    contactSupport: "Twandikire",
    contactInfo: "Itsinda ry'ubufasha",
    contactPage: "Urutonde rwo kuvugana",
    tryAgain: "Ongera ugerageze kwinjira",
    backHome: "Subira ku mbere",
  },
};

const eol = "\r\n";

for (const lang of ["en", "fr", "kin"]) {
  const filePath = path.join(__dirname, "..", "src", "translations", lang + ".json");
  let s = fs.readFileSync(filePath, "utf8");

  if (s.includes('"suspendedAccount"')) {
    console.log(lang + ": already present, skipping");
    continue;
  }

  const b = blocks[lang];
  const body = Object.entries(b)
    .map(([k, v]) => '    "' + k + '": "' + v.replace(/"/g, '\\"') + '"')
    .join("," + eol);

  const block = "," + eol + '  "suspendedAccount": {' + eol + body + eol + "  }";

  const idx = s.lastIndexOf(eol + "}");
  if (idx === -1) {
    console.error(lang + ": could not find closing brace");
    process.exit(1);
  }
  s = s.slice(0, idx) + block + s.slice(idx);
  fs.writeFileSync(filePath, s);
  console.log(lang + ": inserted suspendedAccount");
}

// Validate
for (const lang of ["en", "fr", "kin"]) {
  const t = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "translations", lang + ".json"), "utf8"));
  console.log(lang + " valid, title = " + t.suspendedAccount.title);
}
