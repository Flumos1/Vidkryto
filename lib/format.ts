const UAH = "₴";

export function formatMoney(
  amount: number | null | undefined,
  opts: { compact?: boolean; withSymbol?: boolean; decimals?: number } = {},
): string {
  const { compact = false, withSymbol = true, decimals = 0 } = opts;
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const abs = Math.abs(amount);
  let value: string;
  if (compact && abs >= 1_000_000_000) {
    value = `${trim(abs / 1_000_000_000, 1)} млрд`;
  } else if (compact && abs >= 1_000_000) {
    value = `${trim(abs / 1_000_000, 1)} млн`;
  } else if (compact && abs >= 10_000) {
    value = `${trim(abs / 1_000, 0)} тис`;
  } else {
    value = new Intl.NumberFormat("uk-UA", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(abs);
  }
  const sign = amount < 0 ? "−" : "";
  return withSymbol ? `${sign}${value} ${UAH}` : `${sign}${value}`;
}

function trim(n: number, digits: number) {
  return n
    .toFixed(digits)
    .replace(".", ",")
    .replace(/,0$/, "");
}

export function formatNumber(n: number | null | undefined, compact = false): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (compact && n >= 1_000_000) return `${trim(n / 1_000_000, 1)} млн`;
  if (compact && n >= 10_000) return `${trim(n / 1_000, 0)} тис`;
  return new Intl.NumberFormat("uk-UA").format(n);
}

export function formatPercent(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${trim(n, digits)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Math.max(0, Date.now() - d);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "щойно";
  if (min < 60) return `${min} хв тому`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} дн тому`;
  return formatDate(value);
}

export type Tone = "active" | "complete" | "cancelled" | "unsuccessful" | "neutral";

export function statusMeta(status: string | null | undefined): {
  label: string;
  tone: Tone;
  hint: string;
} {
  switch (status) {
    case "active":
      return { label: "Активна", tone: "active", hint: "Закупівля триває" };
    case "active.tendering":
      return { label: "Прийом пропозицій", tone: "active", hint: "Подання пропозицій" };
    case "active.auction":
      return { label: "Аукціон", tone: "active", hint: "Триває аукціон" };
    case "active.qualification":
      return { label: "Кваліфікація", tone: "active", hint: "Перевірка переможця" };
    case "active.awarded":
      return { label: "Визначено переможця", tone: "active", hint: "Очікування договору" };
    case "complete":
      return { label: "Завершена", tone: "complete", hint: "Договір укладено" };
    case "cancelled":
      return { label: "Скасована", tone: "cancelled", hint: "Закупівлю скасовано" };
    case "unsuccessful":
      return { label: "Не відбулася", tone: "unsuccessful", hint: "Немає пропозицій" };
    default:
      return { label: "Чернетка", tone: "neutral", hint: "Не опублікована" };
  }
}

export function methodLabel(type: string | null | undefined): string {
  const map: Record<string, string> = {
    open: "Відкриті торги",
    openUA: "Відкриті торги",
    limited: "Спрощена закупівля",
    reporting: "Звіт про закупівлю",
    "competitive.dialogue": "Конкурентний діалог",
    "negotiation.quick": "Переговорна процедура",
    "negotiation": "Переговорна процедура",
    "price.quotation": "Цінова пропозиція",
    "requestForProposal": "Запит пропозицій",
    "belowThreshold": "Допорогова закупівля",
  };
  if (!type) return "—";
  return map[type] || type;
}

export const CPV_SECTION_NAMES: Record<string, string> = {
  "03": "Сільгосппродукція",
  "09": "Нафтопродукти",
  "14": "Гірнича сировина",
  "15": "Харчові продукти",
  "16": "Сільгосптехніка",
  "18": "Одяг та взуття",
  "19": "Текстиль",
  "22": "Друкована продукція",
  "24": "Хімічна продукція",
  "30": "Комп'ютерна техніка",
  "31": "Електрообладнання",
  "32": "Радіо та зв'язок",
  "33": "Медичне обладнання",
  "34": "Транспорт",
  "35": "Безпека та охорона",
  "37": "Музичні інструменти",
  "38": "Лабораторне обладнання",
  "39": "Меблі",
  "41": "Водопостачання",
  "42": "Труби та арматура",
  "43": "Гірниче обладнання",
  "44": "Будматеріали",
  "45": "Будівництво",
  "48": "Програмне забезпечення",
  "50": "Ремонт і обслуговування",
  "51": "Монтаж обладнання",
  "55": "Готельні послуги",
  "60": "Транспортні послуги",
  "63": "Логістика",
  "64": "Поштові послуги",
  "65": "Комунальні послуги",
  "66": "Фінансові послуги",
  "70": "Нерухомість",
  "71": "Архітектура та інженерія",
  "72": "IT-послуги",
  "73": "Дослідження",
  "75": "Державне управління",
  "76": "Бізнес-послуги",
  "77": "Сільгосппослуги",
  "79": "Адміністративні послуги",
  "80": "Освіта",
  "85": "Охорона здоров'я",
  "90": "Довкілля",
  "92": "Культура та спорт",
  "98": "Інші послуги",
};

export function cpvSectionName(code: string | null | undefined): string {
  if (!code) return "Інше";
  return CPV_SECTION_NAMES[code.slice(0, 2)] || "Інше";
}

export const REGIONS = [
  "Вінницька",
  "Волинська",
  "Дніпропетровська",
  "Донецька",
  "Житомирська",
  "Закарпатська",
  "Запорізька",
  "Івано-Франківська",
  "Київ",
  "Київська",
  "Кіровоградська",
  "Луганська",
  "Львівська",
  "Миколаївська",
  "Одеська",
  "Полтавська",
  "Рівненська",
  "Сумська",
  "Тернопільська",
  "Харківська",
  "Херсонська",
  "Хмельницька",
  "Черкаська",
  "Чернівецька",
  "Чернігівська",
];

export function initials(name: string): string {
  return name
    .replace(/[«»"'()]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
