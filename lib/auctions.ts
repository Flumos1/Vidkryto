export type Auction = {
  id: string;
  title: string;
  category: string;
  region: string;
  startPrice: number;
  date: string;
  status: "live" | "soon" | "closed";
  organizer: string;
  area?: string;
};

export const demoAuctions: Auction[] = [
  {
    id: "SPE001-UA-2026-10-21-001",
    title: "Нежитлові приміщення 214 м², перший поверх, Київ",
    category: "Оренда",
    region: "Київ",
    startPrice: 48600,
    date: "2026-11-04T10:00:00+02:00",
    status: "soon",
    organizer: "КП «Київжитлоспецексплуатація»",
    area: "214 м²",
  },
  {
    id: "SPE001-UA-2026-10-20-014",
    title: "Вантажний автомобіль MAN TGS 26.440, 2019 р.в.",
    category: "Транспорт",
    region: "Львівська",
    startPrice: 1240000,
    date: "2026-10-29T12:00:00+02:00",
    status: "live",
    organizer: "Фонд гарантування вкладів",
  },
  {
    id: "SPE001-UA-2026-10-19-007",
    title: "Земельна ділянка 12,4 га для сільгоспвиробництва",
    category: "Земля",
    region: "Полтавська",
    startPrice: 3120000,
    date: "2026-11-12T09:00:00+02:00",
    status: "soon",
    organizer: "Головне управління Держгеокадастру",
    area: "12,4 га",
  },
  {
    id: "SPE001-UA-2026-10-18-031",
    title: "Обладнання харчового цеху: лінія фасування, 3 од.",
    category: "Обладнання",
    region: "Дніпропетровська",
    startPrice: 870000,
    date: "2026-10-28T11:00:00+02:00",
    status: "live",
    organizer: "АРМА",
  },
  {
    id: "SPE001-UA-2026-10-17-002",
    title: "Арештовані активи: легковий автомобіль Toyota Camry",
    category: "Арештовані активи",
    region: "Одеська",
    startPrice: 615000,
    date: "2026-10-30T10:00:00+02:00",
    status: "live",
    organizer: "АРМА",
  },
  {
    id: "SPE001-UA-2026-10-15-019",
    title: "Вагони-зерновози, 18 одиниць",
    category: "Транспорт",
    region: "Харківська",
    startPrice: 12400000,
    date: "2026-11-18T10:00:00+02:00",
    status: "soon",
    organizer: "АТ «Укрзалізниця»",
  },
  {
    id: "SPE001-UA-2026-10-12-004",
    title: "Приміщення колишнього дитсадка, 640 м²",
    category: "Приватизація",
    region: "Житомирська",
    startPrice: 1980000,
    date: "2026-10-27T10:00:00+02:00",
    status: "closed",
    organizer: "Фонд державного майна",
    area: "640 м²",
  },
  {
    id: "SPE001-UA-2026-10-10-022",
    title: "Спеціальний дозвіл на видобуток граніту",
    category: "Дозволи",
    region: "Запорізька",
    startPrice: 5400000,
    date: "2026-11-05T10:00:00+02:00",
    status: "soon",
    organizer: "Держгеонадра",
  },
];
