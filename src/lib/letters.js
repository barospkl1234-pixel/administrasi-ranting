export const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function generateLetterNumber(org, typeCategory = 'A', codeDept = 'Sek', db = {}) {
  const settings = db.settings || {};
  const codeIpnu = settings.codeIpnu || '7354';
  const codeIppnu = settings.codeIppnu || '7455';
  
  const now = new Date();
  const romanMonth = ROMAN_MONTHS[now.getMonth()];
  const yearShort = String(now.getFullYear()).slice(-2);

  // Count outgoing letters THIS YEAR only for this org
  const year = String(now.getFullYear());
  const outgoing = (db.letters || []).filter(l =>
    l.type === 'Keluar' &&
    (org === 'BERSAMA' ? l.organization === 'BERSAMA' : l.organization === org) &&
    l.date && l.date.startsWith(year)
  );
  const seq = String(outgoing.length + 1).padStart(3, '0');

  let orgPrefix = 'PR';
  let wilCode = codeIpnu;

  if (org === 'IPPNU') {
    orgPrefix = 'PR';
    wilCode = codeIppnu;
  } else if (org === 'BERSAMA') {
    orgPrefix = 'PR-PR';
    wilCode = `${codeIpnu}-${codeIppnu}`;
  }

  return `${seq}/${orgPrefix}/${typeCategory}/${codeDept}/${wilCode}/${romanMonth}/${yearShort}`;
}
