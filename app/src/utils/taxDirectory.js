export const normalizeTaxCountries = (payload, fallback = []) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.countries)) {
    return payload.countries;
  }

  return fallback;
};

export const normalizeCountryRecord = (country) => ({
  ...country,
  code: country?.code || '',
  name: country?.name || 'Unknown jurisdiction',
  region: country?.region || 'Unspecified',
  tax_authority: country?.tax_authority || {},
  links: country?.links || {},
  supported_tasks: Array.isArray(country?.supported_tasks) ? country.supported_tasks : [],
});

export const normalizeTaxDirectory = (payload, fallback = []) => {
  const countries = normalizeTaxCountries(payload, fallback)
    .filter(Boolean)
    .map(normalizeCountryRecord)
    .sort((left, right) => left.name.localeCompare(right.name));

  return countries.length > 0
    ? countries
    : fallback.filter(Boolean).map(normalizeCountryRecord).sort((left, right) => left.name.localeCompare(right.name));
};