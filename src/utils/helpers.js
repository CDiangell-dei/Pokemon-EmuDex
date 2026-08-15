import { TYPE_CHART, ALL_TYPES } from '../constants/pokemon';

export const padId = (id) => String(id).padStart(4, '0');

export const getIdFromUrl = (url) => {
  if (!url) return 0;
  const parts = url.split('/').filter(Boolean);
  return parseInt(parts[parts.length - 1], 10);
};

export const formatName = (name) => {
  if (!name) return '';
  return name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export const calculateWeaknesses = (types) => {
  if (!types || types.length === 0) return {};
  const effectiveness = {};
  ALL_TYPES.forEach((t) => (effectiveness[t] = 1));
  types.forEach((t) => {
    const typeName = t.type ? t.type.name : t;
    const relations = TYPE_CHART[typeName];
    if (!relations) return;
    Object.entries(relations).forEach(([attacker, mult]) => {
      effectiveness[attacker] *= mult;
    });
  });
  return effectiveness;
};
