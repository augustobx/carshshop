export type HelpTopic = {
  key: string;
  section: string;
  title: string;
  summary: string;
  purpose: string[];
  steps: string[];
  tips?: string[];
  routePrefixes: string[];
  exactRoutes?: string[];
};

export const helpTopics: HelpTopic[] = [
  {
    key: 'dashboard',
    section: 'Inicio',
    title: 'Centro de Operaciones',
    summary: 'Es la pantalla principal del sistema. Resume la situación comercial, el stock y los movimientos más importantes de la concesionaria.',
    purpose: [
      'Ver rápidamente el estado general de la operación.',
      'Detectar pendientes comerciales, stock y actividad reciente.',
      'Entrar desde un único lugar a los módulos de trabajo diario.',
    ],
    steps: [
      'Revisá los indicadores principales al comenzar el día.',
      'Usá los accesos del panel para entrar al módulo que necesites.',
      'Ante un dato que requiera detalle, abrí el módulo correspondiente para trabajar sobre el registro.',
    ],
    tips: ['Usalo como punto de control diario antes de comenzar a cargar operaciones.'],
    routePrefixes: ['/dashboard'],
    exactRoutes: ['/'],
  },
  {
    key: 'prospectos',
    section: 'Comercial',
    title: 'Pipeline y Prospectos',
    summary: 'Organiza las oportunidades comerciales antes de que se conviertan en clientes u operaciones cerradas.',
    purpose: [
      'Registrar personas interesadas aunque todavía no hayan comprado.',
      'Relacionar un prospecto con un vehículo de interés, presupuesto, permuta y origen del contacto.',
      'Programar próximas acciones y seguir el avance del prospecto dentro del pipeline.',
    ],
    steps: [
      'Creá el prospecto con nombre y datos de contacto.',
      'Indicá el vehículo de interés, presupuesto estimado y si tiene permuta cuando corresponda.',
      'Definí una próxima acción para no perder el seguimiento.',
      'Actualizá el estado a medida que avanza la negociación.',
      'Cuando corresponda, continuá el flujo hacia cotización, seña o venta.',
    ],
    tips: ['Mantené siempre actualizada la próxima acción: es el dato más útil para ordenar el trabajo comercial.'],
    routePrefixes: ['/prospectos'],
  },
  {
    key: 'clientes',
    section: 'Comercial',
    title: 'Clientes',
    summary: 'Es la base central de personas y empresas con las que opera la concesionaria.',
    purpose: [
      'Guardar datos de identificación y contacto.',
      'Consultar la carpeta completa de cada cliente.',
      'Relacionar al cliente con ventas, financiación, vehículos y demás operaciones.',
    ],
    steps: [
      'Buscá primero al cliente para evitar duplicados.',
      'Si no existe, crealo con sus datos principales.',
      'Entrá a su ficha para consultar su historial y relaciones con otras operaciones.',
      'Actualizá teléfono, correo, domicilio o notas cuando cambien.',
    ],
    tips: ['Usá DNI/CUIT y teléfono correctamente para encontrar al cliente con rapidez en futuras operaciones.'],
    routePrefixes: ['/clientes'],
  },
  {
    key: 'vehiculos',
    section: 'Inventario',
    title: 'Vehículos',
    summary: 'Administra el stock de autos y la ficha completa de cada unidad desde su ingreso hasta la venta.',
    purpose: [
      'Registrar datos técnicos, patente, VIN, kilometraje y características de la unidad.',
      'Controlar valores de compra y venta en USD/ARS, estado y sucursal.',
      'Gestionar fotos, notas, tareas de preparación y gastos asociados a cada vehículo.',
      'Distinguir unidades propias, consignadas, señadas o vendidas.',
    ],
    steps: [
      'Creá la unidad cargando los datos disponibles y su tipo de ingreso.',
      'Definí precio de compra y precio de venta cuando corresponda.',
      'Asigná la sucursal y mantené actualizado el estado del vehículo.',
      'Dentro de la ficha agregá fotos, observaciones, tareas o gastos de preparación.',
      'Cuando la unidad se venda, continuá el proceso desde Ventas y Cotizador.',
    ],
    tips: ['No uses valores estimados como si fueran históricos: si un importe no se conoce, es preferible dejarlo pendiente y documentarlo.'],
    routePrefixes: ['/vehiculos'],
  },
  {
    key: 'motos',
    section: 'Inventario',
    title: 'Motos',
    summary: 'Presenta y administra las unidades cuyo tipo de vehículo es moto, utilizando la misma lógica de inventario del sistema.',
    purpose: [
      'Separar visualmente el stock de motos del stock de autos.',
      'Consultar precios, estado, sucursal y datos de cada unidad.',
      'Mantener el mismo flujo de preparación y venta utilizado para vehículos.',
    ],
    steps: [
      'Ingresá al listado para consultar las motos disponibles.',
      'Abrí la ficha de la unidad que quieras revisar o editar.',
      'Mantené precio, estado y datos técnicos actualizados.',
      'Continuá la operación comercial desde Ventas cuando la unidad sea negociada.',
    ],
    routePrefixes: ['/motos'],
  },
  {
    key: 'consignaciones',
    section: 'Inventario',
    title: 'Consignaciones',
    summary: 'Controla las unidades que la concesionaria comercializa por cuenta de un tercero.',
    purpose: [
      'Identificar claramente vehículos que no son stock propio.',
      'Relacionar la unidad con su propietario/cliente.',
      'Registrar la comisión de consignación y seguir su estado comercial.',
    ],
    steps: [
      'Registrá o identificá al propietario de la unidad.',
      'Cargá el vehículo como ingreso por consignación.',
      'Definí la comisión acordada y el precio de venta.',
      'Mantené actualizado el estado hasta la venta o devolución de la unidad.',
    ],
    tips: ['Verificá siempre propietario, comisión y precio acordado antes de avanzar con una venta.'],
    routePrefixes: ['/consignaciones'],
  },
  {
    key: 'ventas',
    section: 'Operaciones',
    title: 'Ventas y Cotizador',
    summary: 'Concentra las cotizaciones y el cierre de operaciones de venta de la concesionaria.',
    purpose: [
      'Cotizar una unidad con la cotización del dólar vigente.',
      'Vincular cliente, vehículo y vendedor dentro de la operación.',
      'Registrar venta contado o financiada, anticipo y cuotas.',
      'Contemplar permutas y mantener el historial de la operación.',
    ],
    steps: [
      'Seleccioná el cliente y el vehículo de la operación.',
      'Revisá precio final y cotización del dólar utilizada.',
      'Elegí la forma de pago: contado o cuotas.',
      'Si corresponde, cargá anticipo, financiación o permuta.',
      'Revisá todos los valores antes de confirmar la venta.',
      'Entrá luego al detalle de la venta para consultar su historial y documentación relacionada.',
    ],
    tips: ['La cotización guardada en la venta debe representar la usada realmente al momento de cerrar la operación.'],
    routePrefixes: ['/ventas'],
  },
  {
    key: 'cuotas',
    section: 'Administración',
    title: 'Cobranzas y Cuotas',
    summary: 'Permite controlar y registrar el cobro de las cuotas originadas en ventas financiadas.',
    purpose: [
      'Consultar cuotas pendientes y pagadas.',
      'Controlar fechas de vencimiento.',
      'Registrar pagos en pesos con la cotización aplicada al momento del cobro.',
      'Mantener trazabilidad de la cobranza de cada venta.',
    ],
    steps: [
      'Buscá la operación o cuota que se desea cobrar.',
      'Verificá monto, vencimiento y estado antes de registrar el pago.',
      'Ingresá el monto pagado y la cotización usada en el cobro.',
      'Confirmá el pago y comprobá que la cuota quede actualizada.',
    ],
    tips: ['No marques una cuota como pagada si todavía falta confirmar el ingreso real del dinero.'],
    routePrefixes: ['/cuotas'],
  },
  {
    key: 'prestamos',
    section: 'Administración',
    title: 'Financiación',
    summary: 'Administra préstamos y planes de financiación independientes de una venta.',
    purpose: [
      'Registrar capital entregado y total a devolver.',
      'Relacionar la financiación con un cliente.',
      'Generar y controlar cuotas, vencimientos y pagos.',
      'Consultar si un préstamo está activo o finalizado.',
    ],
    steps: [
      'Seleccioná al cliente.',
      'Cargá el capital entregado, total a devolver y cotización utilizada.',
      'Definí o revisá el esquema de cuotas.',
      'Registrá cada cobro a medida que se realiza.',
      'Controlá que el estado final refleje correctamente la situación del préstamo.',
    ],
    routePrefixes: ['/prestamos'],
  },
  {
    key: 'caja',
    section: 'Administración',
    title: 'Caja y Gastos',
    summary: 'Registra ingresos y egresos operativos de la concesionaria y permite vincular gastos con una unidad.',
    purpose: [
      'Registrar movimientos de ingreso o egreso.',
      'Clasificar cada movimiento por categoría y sucursal.',
      'Guardar el monto en ARS y su equivalencia en USD según la cotización del día.',
      'Asociar gastos a un vehículo para incorporarlos a su costo real cuando corresponda.',
    ],
    steps: [
      'Elegí si el movimiento es ingreso o egreso.',
      'Ingresá concepto, categoría, monto y cotización del día.',
      'Seleccioná sucursal y vehículo cuando el movimiento pertenezca a una unidad específica.',
      'Confirmá el movimiento y revisá el impacto en la caja y, si corresponde, en el costo del vehículo.',
    ],
    tips: ['Vincular correctamente los gastos de preparación al vehículo permite calcular un costo real más útil.'],
    routePrefixes: ['/caja'],
  },
  {
    key: 'documentos',
    section: 'Administración',
    title: 'Documentos',
    summary: 'Centraliza documentos y comprobantes generados a partir de las operaciones del sistema.',
    purpose: [
      'Consultar documentación comercial asociada a ventas y clientes.',
      'Preparar información para impresión o entrega.',
      'Mantener la documentación relacionada con una operación en un único lugar.',
    ],
    steps: [
      'Buscá la operación o cliente relacionado.',
      'Elegí el documento que necesitás consultar o generar.',
      'Revisá los datos antes de imprimir o compartir.',
    ],
    routePrefixes: ['/documentos'],
  },
  {
    key: 'sucursales',
    section: 'Gestión',
    title: 'Sucursales',
    summary: 'Administra las ubicaciones físicas desde las que trabaja la concesionaria.',
    purpose: [
      'Crear y mantener sucursales activas.',
      'Definir una sucursal principal.',
      'Asignar vehículos, usuarios y movimientos a la ubicación correcta.',
    ],
    steps: [
      'Creá la sucursal con nombre, código y datos de contacto.',
      'Marcá la principal cuando corresponda.',
      'Desactivá una sucursal que ya no se utilice en lugar de reutilizarla para otra ubicación.',
    ],
    routePrefixes: ['/sucursales'],
  },
  {
    key: 'usuarios',
    section: 'Gestión',
    title: 'Usuarios y Accesos',
    summary: 'Gestiona quién puede ingresar a la concesionaria y con qué rol trabaja cada persona.',
    purpose: [
      'Crear usuarios del equipo.',
      'Asignar roles y sucursal.',
      'Activar o desactivar accesos.',
      'Definir comisión cuando corresponda.',
    ],
    steps: [
      'Creá o seleccioná el usuario.',
      'Asigná el rol que representa su función real.',
      'Elegí la sucursal correspondiente.',
      'Configurá comisión si aplica.',
      'Desactivá el acceso cuando una persona deje de operar en la concesionaria.',
    ],
    tips: ['No compartas usuarios entre personas: cada integrante debe trabajar con su propio acceso.'],
    routePrefixes: ['/usuarios'],
  },
  {
    key: 'configuracion',
    section: 'Gestión',
    title: 'Configuración',
    summary: 'Define los datos generales, identidad visual y parámetros comerciales de la concesionaria.',
    purpose: [
      'Configurar nombre, datos de contacto y datos fiscales.',
      'Definir logo y colores de la experiencia.',
      'Gestionar tipo y valor de dólar utilizado por el sistema.',
      'Configurar TNA de financiación, comisión por defecto y parámetros de la PWA comercial.',
    ],
    steps: [
      'Revisá primero los datos generales de la concesionaria.',
      'Configurá logo y colores si necesitás personalizar la experiencia.',
      'Elegí el tipo de dólar y mantené actualizada su cotización.',
      'Definí los parámetros de financiación y comisión.',
      'Guardá los cambios y verificá el resultado en las pantallas relacionadas.',
    ],
    tips: ['Cambiar la cotización puede recalcular importes de inventario expresados en ARS; revisá los datos antes de guardar.'],
    routePrefixes: ['/configuracion'],
  },
  {
    key: 'pwa-dashboard',
    section: 'PWA de vendedores',
    title: 'Inicio móvil del vendedor',
    summary: 'Es el centro de trabajo móvil del vendedor, pensado para usar desde el teléfono durante la atención comercial.',
    purpose: [
      'Acceder rápidamente a las funciones comerciales habilitadas.',
      'Ver la cotización vigente y el estado de trabajo del vendedor.',
      'Entrar al cotizador, operaciones y fichas de vehículos desde una interfaz móvil.',
    ],
    steps: [
      'Ingresá con tu usuario desde el dominio de la concesionaria.',
      'Usá los accesos rápidos para comenzar una cotización o revisar operaciones.',
      'Volvé al inicio cuando quieras cambiar de tarea comercial.',
    ],
    routePrefixes: ['/pwa/dashboard'],
  },
  {
    key: 'pwa-cotizador',
    section: 'PWA de vendedores',
    title: 'Cotizador móvil',
    summary: 'Permite al vendedor preparar una propuesta comercial desde el celular sin entrar al panel administrativo.',
    purpose: [
      'Seleccionar una unidad disponible.',
      'Trabajar con precio, cotización, anticipo, financiación y permuta.',
      'Preparar una propuesta mientras se atiende al cliente.',
    ],
    steps: [
      'Elegí el vehículo sobre el que querés cotizar.',
      'Revisá precio y cotización vigente.',
      'Completá las condiciones comerciales necesarias.',
      'Verificá el resultado antes de continuar con la operación.',
    ],
    routePrefixes: ['/pwa/cotizador'],
  },
  {
    key: 'pwa-operaciones',
    section: 'PWA de vendedores',
    title: 'Operaciones del vendedor',
    summary: 'Muestra las operaciones comerciales vinculadas al vendedor para que pueda seguirlas desde el teléfono.',
    purpose: [
      'Consultar cotizaciones y operaciones recientes.',
      'Dar seguimiento al avance comercial sin utilizar el ERP de escritorio.',
      'Acceder al detalle necesario durante la atención al cliente.',
    ],
    steps: [
      'Ingresá al listado de operaciones.',
      'Seleccioná la operación que quieras revisar.',
      'Consultá su estado y los datos comerciales disponibles.',
      'Continuá el flujo desde la acción habilitada para esa operación.',
    ],
    routePrefixes: ['/pwa/operaciones'],
  },
  {
    key: 'pwa-vehiculo',
    section: 'PWA de vendedores',
    title: 'Ficha móvil del vehículo',
    summary: 'Presenta al vendedor la información comercial de una unidad desde una vista optimizada para celular.',
    purpose: [
      'Consultar datos y precio de la unidad durante la atención.',
      'Revisar la información necesaria antes de cotizar.',
      'Pasar rápidamente desde la ficha del vehículo a una acción comercial.',
    ],
    steps: [
      'Abrí la unidad desde el stock o desde una operación.',
      'Revisá características, precio y estado.',
      'Usá las acciones disponibles para continuar con la cotización u operación.',
    ],
    routePrefixes: ['/pwa/vehiculo'],
  },
];

export function resolveHelpTopic(pathname: string): HelpTopic {
  const exact = helpTopics.find((topic) => topic.exactRoutes?.includes(pathname));
  if (exact) return exact;

  const candidates = helpTopics
    .flatMap((topic) => topic.routePrefixes.map((prefix) => ({ topic, prefix })))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  const found = candidates.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (found) return found.topic;

  return helpTopics[0];
}

export const helpSections = Array.from(new Set(helpTopics.map((topic) => topic.section)));
