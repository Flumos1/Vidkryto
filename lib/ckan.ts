const CKAN = "https://data.gov.ua/api/3/action";
const UA = "Vidkryto/1.0 (+https://github.com/Flumos1/Vidkryto)";

export type CkanResource = {
  id: string;
  name: string;
  format: string;
  url: string;
  last_modified: string | null;
  created: string | null;
  mimetype: string | null;
};

export type CkanPackage = {
  id: string;
  title: string;
  notes: string;
  license_id: string;
  metadata_modified: string;
  update_frequency?: string;
  organization?: { title: string };
  resources: CkanResource[];
};

async function ckan<T>(action: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${CKAN}/${action}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`CKAN ${action}: HTTP ${res.status}`);
  const json = (await res.json()) as { success: boolean; result: T };
  if (!json.success) throw new Error(`CKAN ${action}: unsuccessful response`);
  return json.result;
}

export function packageShow(id: string): Promise<CkanPackage> {
  return ckan<CkanPackage>("package_show", { id });
}

export function resourceShow(id: string): Promise<CkanResource> {
  return ckan<CkanResource>("resource_show", { id });
}

export function latestResource(pkg: CkanPackage): CkanResource | undefined {
  return [...pkg.resources]
    .filter((r) => r.url)
    .sort((a, b) => {
      const at = new Date(a.last_modified || a.created || 0).getTime();
      const bt = new Date(b.last_modified || b.created || 0).getTime();
      return bt - at;
    })[0];
}
