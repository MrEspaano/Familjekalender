export const PERSONS = [
  { id: 'erik', name: 'Erik', defaultColor: '#3B82F6' },
  { id: 'suzanne', name: 'Suzanne', defaultColor: '#A855F7' },
  { id: 'lilly', name: 'Lilly', defaultColor: '#22C55E' },
  { id: 'alla', name: 'Alla', defaultColor: '#EAB308' },
];

export const PERSON_IDS = PERSONS.map((p) => p.id);

export const DAY_NAMES = ['Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör', 'Sön'];
export const DAY_NAMES_LONG = [
  'Måndag',
  'Tisdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lördag',
  'Söndag',
];
export const MONTH_NAMES = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

export const HOUR_START = 6;
export const HOUR_END = 22;

export const EVENT_TYPES = [
  { id: 'event', label: 'Händelse', icon: '📅' },
  { id: 'meal', label: 'Måltid', icon: '🍲' },
  { id: 'chore', label: 'Syssla', icon: '🧹' },
  { id: 'mood', label: 'Humör', icon: '✨' },
];
