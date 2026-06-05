type PlantillaCSV = {
  columnas: string[];
  ejemplo: string[];
};

const PLANTILLAS: Record<string, PlantillaCSV> = {
  clientes: {
    columnas: [
      'nombre_razon_social',
      'tipo',
      'nit_cedula',
      'email',
      'telefono',
      'ciudad',
      'nombre_contacto',
      'cargo_contacto',
    ],
    ejemplo: [
      'Constructora Andina SAS',
      'empresa',
      '900123456-1',
      'contacto@andina.com',
      '6014567890',
      'Bogotá',
      'Carlos Pérez',
      'Gerente de Proyectos',
    ],
  },
  proveedores: {
    columnas: [
      'nombre_razon_social',
      'tipo',
      'categoria',
      'nit_cedula',
      'email',
      'telefono',
      'ciudad',
      'sitio_web',
    ],
    ejemplo: [
      'Ferretería El Constructor',
      'empresa',
      'ferreteria',
      '800987654-2',
      'ventas@elconstructor.com',
      '3001234567',
      'Medellín',
      'https://elconstructor.com',
    ],
  },
  insumos: {
    columnas: ['nombre', 'categoria', 'unidad', 'precio_unitario'],
    ejemplo: ['Cemento Portland tipo I', 'Materiales', 'kg', '850'],
  },
};

function escaparCampoCSV(valor: string): string {
  if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function generarCSV(plantilla: PlantillaCSV): string {
  const header = plantilla.columnas.map(escaparCampoCSV).join(',');
  const fila = plantilla.ejemplo.map(escaparCampoCSV).join(',');
  return `${header}\n${fila}\n`;
}

export function descargarPlantillaCSV(entidad: 'clientes' | 'proveedores' | 'insumos'): void {
  const plantilla = PLANTILLAS[entidad];
  if (!plantilla) return;

  const csv = generarCSV(plantilla);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plantilla_${entidad}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getColumnasRequeridas(entidad: 'clientes' | 'proveedores' | 'insumos'): string[] {
  return PLANTILLAS[entidad]?.columnas ?? [];
}
