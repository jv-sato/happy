export function setStatus(element, message = '', isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatBrazilianDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Não foi possível parsear o item ${key}:`, error);
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function clearKeys(keys) {
  keys.forEach((key) => localStorage.removeItem(key));
}

export function getLatestAllowedBirthDate() {
  const now = new Date();
  const month = now.getMonth();
  const date = new Date(now.getFullYear() - 18, month, now.getDate());
  if (date.getMonth() !== month) date.setDate(0);

  const year = date.getFullYear();
  const monthText = String(date.getMonth() + 1).padStart(2, '0');
  const dayText = String(date.getDate()).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}
