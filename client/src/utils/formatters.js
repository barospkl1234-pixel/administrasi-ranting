export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export function formatDateWithDay(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu'];
  const dayName = days[date.getDay()];
  return `${dayName}, ${formatDate(dateString)}`;
}

// Tanggal hari ini format YYYY-MM-DD pada zona WIB (Asia/Jakarta)
export function todayWIBString() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Perkiraan konversi penanggalan Hijriyah untuk surat resmi
export function getHijriDateString(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  
  // Perkiraan kalkulasi kalender Hijriyah standar (Tabular Islamic Calendar)
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();

  let julianDay = (1461 * (y + 4800 + (m - 13) / 12)) / 4 +
    (367 * (m - 1 - 12 * ((m - 13) / 12))) / 12 -
    (3 * ((y + 4900 + (m - 13) / 12) / 100)) / 4 +
    d - 32075;

  julianDay = Math.floor(julianDay);
  const l = julianDay - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const lSub = l - 10631 * n + 354;
  const j = (Math.floor((10985 - lSub) / 5316)) * (Math.floor((50 * lSub) / 17719)) +
    (Math.floor(lSub / 5670)) * (Math.floor((43 * lSub) / 15238));
  const lSub2 = lSub - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
    (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  const hijriMonth = Math.floor((24 * lSub2) / 709);
  const hijriDay = lSub2 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  const hijriMonths = [
    'Muharram', 'Safar', 'Rabi\'ul Awwal', 'Rabi\'ul Akhir',
    'Jumadil Ula', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
    'Ramadhan', 'Syawwal', 'Dzulqa\'dah', 'Dzulhijjah'
  ];

  const monthName = hijriMonths[hijriMonth - 1] || 'Safar';
  return `${hijriDay} ${monthName} ${hijriYear} H`;
}

export function getOrgColorClass(org) {
  if (org === 'IPNU') {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  } else if (org === 'IPPNU') {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  }
  return {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-900 border-teal-300'
  };
}

