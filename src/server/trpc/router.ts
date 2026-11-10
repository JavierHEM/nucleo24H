import { router } from "./trpc";
import { sellosRouter } from "./routers/sellos";
import { registrosRouter } from "./routers/registros";
import { documentosRouter } from "./routers/documentos";
import { arsopbRouter } from "./routers/arsopb";
import { visitasRouter } from "./routers/visitas";
import { comunicacionesRouter } from "./routers/comunicaciones";
import { localesRouter } from "./routers/locales";
import { empresasRouter } from "./routers/empresas";
import { tareasRouter } from "./routers/tareas";
import { informesRouter } from "./routers/informes";
import { pagosRouter } from "./routers/pagos";
import { programaRouter } from "./routers/programa";
import { planRouter } from "./routers/plan";
import { ambientalRouter } from "./routers/ambiental";
import { calendarioRouter } from "./routers/calendario";
import { fiscalizacionesRouter } from "./routers/fiscalizaciones";
import { leadsRouter } from "./routers/leads";
import { hallazgosRouter } from "./routers/hallazgos";
import { proveedoresRouter } from "./routers/proveedores";
import { capacitacionesLmsRouter } from "./routers/capacitacionesLms";
import { declaracionesRouter } from "./routers/declaraciones";
import { alertasRouter } from "./routers/alertas";
import { tutorialesRouter } from "./routers/tutoriales";

export const appRouter = router({
  sellos: sellosRouter,
  registros: registrosRouter,
  documentos: documentosRouter,
  arsopb: arsopbRouter,
  visitas: visitasRouter,
  comunicaciones: comunicacionesRouter,
  locales: localesRouter,
  empresas: empresasRouter,
  tareas: tareasRouter,
  informes: informesRouter,
  pagos: pagosRouter,
  programa: programaRouter,
  plan: planRouter,
  ambiental: ambientalRouter,
  calendario: calendarioRouter,
  fiscalizaciones: fiscalizacionesRouter,
  leads: leadsRouter,
  hallazgos: hallazgosRouter,
  proveedores: proveedoresRouter,
  capacitacionesLms: capacitacionesLmsRouter,
  declaraciones: declaracionesRouter,
  alertas: alertasRouter,
  tutoriales: tutorialesRouter,
});

export type AppRouter = typeof appRouter;
