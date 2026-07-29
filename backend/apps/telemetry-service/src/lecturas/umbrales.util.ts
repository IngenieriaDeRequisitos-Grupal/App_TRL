import { NivelGravedad } from '../alertas/alerta-medica.entity';

/**
 * Evalua umbrales clinicos basicos por tipo de medicion.
 * Devuelve el nivel de gravedad si el valor esta fuera de rango, o null si es normal.
 */
export function evaluarUmbralClinico(tipo_medicion: string, valor: number): NivelGravedad | null {
  switch (tipo_medicion.toUpperCase()) {
    case 'FRECUENCIA_CARDIACA':
      if (valor >= 150 || valor <= 35) return NivelGravedad.CRITICA;
      if (valor >= 120 || valor <= 45) return NivelGravedad.GRAVE;
      return null;
    case 'SATURACION_OXIGENO':
      if (valor < 85) return NivelGravedad.CRITICA;
      if (valor < 92) return NivelGravedad.GRAVE;
      return null;
    case 'PRESION_ARTERIAL_SISTOLICA':
      if (valor >= 180 || valor <= 80) return NivelGravedad.CRITICA;
      if (valor >= 140 || valor <= 90) return NivelGravedad.MODERADA;
      return null;
    case 'TEMPERATURA':
      if (valor >= 40 || valor <= 34) return NivelGravedad.CRITICA;
      if (valor >= 38.5) return NivelGravedad.MODERADA;
      return null;
    default:
      return null;
  }
}
