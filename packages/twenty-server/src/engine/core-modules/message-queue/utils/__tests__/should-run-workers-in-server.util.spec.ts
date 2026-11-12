import { shouldRunWorkersInServer } from 'src/engine/core-modules/message-queue/utils/should-run-workers-in-server.util';

describe('shouldRunWorkersInServer', () => {
  const original = process.env.RUN_WORKERS_IN_SERVER;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.RUN_WORKERS_IN_SERVER;
    } else {
      process.env.RUN_WORKERS_IN_SERVER = original;
    }
  });

  it.each(['true', 'TRUE', '1', 'yes', 'on'])(
    'returns true for %s',
    (value) => {
      process.env.RUN_WORKERS_IN_SERVER = value;
      expect(shouldRunWorkersInServer()).toBe(true);
    },
  );

  it.each(['false', '0', 'no', '', undefined])(
    'returns false for %s',
    (value) => {
      if (value === undefined) {
        delete process.env.RUN_WORKERS_IN_SERVER;
      } else {
        process.env.RUN_WORKERS_IN_SERVER = value;
      }
      expect(shouldRunWorkersInServer()).toBe(false);
    },
  );
});
