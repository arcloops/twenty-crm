import { configTransformers } from 'src/engine/core-modules/twenty-config/utils/config-transformers.util';

// Nest @Module imports are fixed when this file loads, before ConfigModule
// hydrates .env — so Railway/Docker must inject RUN_WORKERS_IN_SERVER into
// the process environment. Accept the same truthy strings as ConfigVariables.
export const shouldRunWorkersInServer = (): boolean =>
  configTransformers.boolean(process.env.RUN_WORKERS_IN_SERVER) === true;
