import type { ServiceCategory } from './types';

export function normalizeServiceName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ': ')
    .trim();
}

export function categorizeService(serviceName: string): ServiceCategory {
  const s = serviceName.toLowerCase();
  if (/(corte|barba|flequillo)/.test(s)) return 'corte';
  if (/(color|tint|balayage|mechas|iluminación|iluminacion)/.test(s)) return 'color';
  if (/(cauterización|cauterizacion|botox|alisado|keratina)/.test(s)) return 'cauterizacion';
  if (/(peinado|brushing|planchado)/.test(s)) return 'peinado';
  if (/(tratamiento|baño de crema|nutrición|hidratación|hidratacion)/.test(s)) return 'tratamientos';
  return 'otros';
}


