export const site = {
  name: "Vidkryto",
  nameUa: "Відкрито",
  domain: "vidkryto.ua",
  tagline: "Аналітика публічних закупівель України",
  description:
    "Пошук, аналітика та перевірка контрагентів за даними ProZorro. Кожна гривня під наглядом.",
  email: "hello@vidkryto.ua",
  github: "https://github.com",
} as const;

export const nav = [
  { href: "/tenders", label: "Закупівлі" },
  { href: "/analytics", label: "Аналітика" },
  { href: "/companies", label: "Компанії" },
  { href: "/prices", label: "Ціни" },
  { href: "/auctions", label: "Аукціони" },
  { href: "/api-docs", label: "API" },
] as const;
