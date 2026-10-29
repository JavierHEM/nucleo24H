import { router } from "./trpc";
import { sellosRouter } from "./routers/sellos";
import { registrosRouter } from "./routers/registros";
import { documentosRouter } from "./routers/documentos";
import { arsopbRouter } from "./routers/arsopb";
import { visitasRouter } from "./routers/visitas";
import { comunicacionesRouter } from "./routers/comunicaciones";
import { localesRouter } from "./routers/locales";
import { tareasRouter } from "./routers/tareas";
import { informesRouter } from "./routers/informes";
import { pagosRouter } from "./routers/pagos";
import { programaRouter } from "./routers/programa";
import { planRouter } from "./routers/plan";
import { ambientalRouter } from "./routers/ambiental";
import { calendarioRouter } from "./routers/calendario";
import { fiscalizacionesRouter } from "./routers/fiscalizaciones";

export const appRouter = router({
  sellos: sellosRouter,
  registros: registrosRouter,
  documentos: documentosRouter,
  arsopb: arsopbRouter,
  visitas: visitasRouter,
  comunicaciones: comunicacionesRouter,
  locales: localesRouter,
  tareas: tareasRouter,
  informes: informesRouter,
  pagos: pagosRouter,
  programa: programaRouter,
  plan: planRouter,
  ambiental: ambientalRouter,
  calendario: calendarioRouter,
  fiscalizaciones: fiscalizacionesRouter,
});

export type AppRouter = typeof appRouter;
