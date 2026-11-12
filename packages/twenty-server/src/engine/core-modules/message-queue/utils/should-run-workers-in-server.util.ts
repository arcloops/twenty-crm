import { resolve } from 'path';

import { config } from 'dotenv';

import { configTransformers } from 'src/engine/core-modules/twenty-config/utils/config-transformers.util';

let didLoadDotenv = false;

// Nest @Module imports are fixed when AppModule loads, before ConfigModule
// runs — so this gate cannot use TwentyConfigService. Load .env once (without
// overriding already-injected Railway/Docker env) for local `yarn start`.
const ensureProcessEnvLoaded = (): void => {
  if (didLoadDotenv) {
    return;
  }

  didLoadDotenv = true;
  const envFilePath =
    process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

  config({ path: resolve(process.cwd(), envFilePath) });
};

export const shouldRunWorkersInServer = (): boolean => {
  ensureProcessEnvLoaded();

  return configTransformers.boolean(process.env.RUN_WORKERS_IN_SERVER) === true;
};
