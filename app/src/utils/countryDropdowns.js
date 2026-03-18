import { countries as detailedCountries } from './countries';
import taxCountries from '../data/tax/countries.json';
import { normalizeTaxDirectory } from './taxDirectory';

const detailedCountriesByCode = new Map(
  detailedCountries.map((country) => [country.code, country]),
);

const regionLabels = {
  Africa: 'Africa',
  Americas: 'Americas',
  Asia: 'Asia',
  Europe: 'Europe',
  Oceania: 'Oceania',
};

export const countryDropdownOptions = normalizeTaxDirectory(taxCountries)
  .filter((country) => country.region !== 'Territories')
  .slice(0, 192)
  .map((country) => {
    const detailedCountry = detailedCountriesByCode.get(country.code);

    return {
      code: country.code,
      name: country.name,
      region: regionLabels[country.region] || country.region || 'Other',
      dialCode: detailedCountry?.dialCode || '',
      flag: detailedCountry?.flag || '',
      currency: detailedCountry?.currency || null,
      banks: detailedCountry?.banks || [],
    };
  });

export const countryDropdownOptionsByCode = new Map(
  countryDropdownOptions.map((country) => [country.code, country]),
);

export const countryDropdownOptionsByName = new Map(
  countryDropdownOptions.map((country) => [country.name, country]),
);