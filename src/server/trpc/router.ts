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
});

export type AppRouter = typeof appRouter;
