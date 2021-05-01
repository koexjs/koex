import { bootstrap } from '../src/index';

describe('@koex/logger', () => {
  it('ok', async () => {
    await new Promise<void>((resolve) => {
      bootstrap()
        .loadConfig(async () => {
          return {
            host: '127.0.0.1',
            port: '6666',
          };
        })
        .loadHelpers(async () => {
          return {};
        })
        .loadMiddlewares(async () => {
          return {};
        })
        .loadModels(async () => {
          return {};
        })
        .loadServices(async () => {
          return {};
        })
        .loadApplications(async () => {
          return {};
        })
        .loadRoutes(async () => {
          return {};
        })
        .prepare()
        .then((boot) => {
          expect(boot.app).toHaveProperty('config');
          expect(boot.app).toHaveProperty('helpers');
          expect(boot.app).toHaveProperty('middlewares');
          expect(boot.app).toHaveProperty('models');
          expect(boot.app).toHaveProperty('services');
          expect(boot.app).toHaveProperty('applications');
          expect(boot.app).toHaveProperty('routes');

          boot.startServer().then((server) => {
            console.log(boot.app.config);
            console.log('boot time: ', boot.app.bootInfo.bootTime);

            setTimeout(() => {
              server.close(() => {
                console.log('up time: ', boot.app.bootInfo.uptime);
                resolve();
              });
            }, 100);
          });
        });
    });
  });
});
