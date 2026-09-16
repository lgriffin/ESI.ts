import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  loadAdmZip,
  loadJsYaml,
  requireOptionalPeer,
} from '../../../src/sde/optionalPeers';
import { SdeError } from '../../../src/sde/errors';

function notFound(
  id: string,
  code = 'MODULE_NOT_FOUND',
): NodeJS.ErrnoException {
  return Object.assign(new Error(`Cannot find module '${id}'`), { code });
}

function throwing(err: unknown): (id: string) => never {
  return () => {
    throw err;
  };
}

describe('optional peer dependencies of ./sde', () => {
  describe('requireOptionalPeer', () => {
    it('returns the module the loader resolves', () => {
      const yamlModule = { load: jest.fn() };
      const load = jest.fn().mockReturnValue(yamlModule);

      expect(requireOptionalPeer('js-yaml', 'parse SDE YAML files', load)).toBe(
        yamlModule,
      );
      expect(load).toHaveBeenCalledWith('js-yaml');
    });

    it.each(['MODULE_NOT_FOUND', 'ERR_MODULE_NOT_FOUND'])(
      'throws an SdeError naming the peer and its install command (%s)',
      (code) => {
        const load = throwing(notFound('adm-zip', code));

        let thrown: unknown;
        try {
          requireOptionalPeer('adm-zip', 'read SDE ZIP archives', load);
        } catch (err) {
          thrown = err;
        }

        expect(thrown).toBeInstanceOf(SdeError);
        expect((thrown as SdeError).message).toBe(
          'adm-zip is required to read SDE ZIP archives. It is an optional peer dependency of @lgriffin/esi.ts; install it with: npm install adm-zip',
        );
      },
    );

    it('rethrows a module-not-found error for a different module unchanged', () => {
      const nested = notFound('argparse');

      expect(() =>
        requireOptionalPeer('js-yaml', 'parse', throwing(nested)),
      ).toThrow(nested);
    });

    it('rethrows other errors raised while loading the peer unchanged', () => {
      const broken = new SyntaxError("Unexpected token in 'js-yaml'");

      expect(() =>
        requireOptionalPeer('js-yaml', 'parse', throwing(broken)),
      ).toThrow(broken);
    });

    it('rethrows a non-Error value unchanged', () => {
      expect(() =>
        requireOptionalPeer('js-yaml', 'parse', throwing('js-yaml')),
      ).toThrow('js-yaml');
    });
  });

  describe('when the peers are installed', () => {
    it('loadJsYaml returns js-yaml', () => {
      expect(loadJsYaml().load('a: 1')).toEqual({ a: 1 });
    });

    it('loadAdmZip returns the adm-zip constructor', () => {
      const AdmZip = loadAdmZip();
      expect(new AdmZip().getEntries()).toEqual([]);
    });
  });

  describe('when module resolution cannot find the peers', () => {
    let dir: string;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sde-peers-'));
    });

    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
      jest.dontMock('node:module');
    });

    /** Loads the SDE modules against a createRequire that finds nothing. */
    function withoutPeers<T>(
      body: (modules: {
        SdeDataProvider: typeof import('../../../src/sde/SdeDataProvider').SdeDataProvider;
        SdeExtractor: typeof import('../../../src/sde/ingestion/SdeExtractor').SdeExtractor;
        SdeErrorClass: typeof SdeError;
      }) => T,
    ): T {
      jest.doMock('node:module', () => ({
        ...jest.requireActual<typeof import('node:module')>('node:module'),
        createRequire: () => (id: string) => {
          throw notFound(id);
        },
      }));
      let result: T | undefined;
      jest.isolateModules(() => {
        result = body({
          SdeDataProvider: (
            jest.requireActual(
              '../../../src/sde/SdeDataProvider',
            ) as typeof import('../../../src/sde/SdeDataProvider')
          ).SdeDataProvider,
          SdeExtractor: (
            jest.requireActual(
              '../../../src/sde/ingestion/SdeExtractor',
            ) as typeof import('../../../src/sde/ingestion/SdeExtractor')
          ).SdeExtractor,
          SdeErrorClass: (
            jest.requireActual(
              '../../../src/sde/errors',
            ) as typeof import('../../../src/sde/errors')
          ).SdeError,
        });
      });
      return result as T;
    }

    it('still imports the SDE modules', () => {
      withoutPeers(({ SdeDataProvider, SdeExtractor }) => {
        expect(typeof SdeDataProvider.fromDirectory).toBe('function');
        expect(new SdeExtractor()).toBeDefined();
      });
    });

    it('fromDirectory throws an SdeError naming js-yaml once there is YAML to parse', () => {
      fs.writeFileSync(path.join(dir, '_sde.yaml'), 'buildNumber: 1\n');

      withoutPeers(({ SdeDataProvider, SdeErrorClass }) => {
        expect(() => SdeDataProvider.fromDirectory(dir)).toThrow(SdeErrorClass);
        expect(() => SdeDataProvider.fromDirectory(dir)).toThrow(
          'install it with: npm install js-yaml',
        );
      });
    });

    it('fromDirectory does not need js-yaml for a directory without YAML files', () => {
      withoutPeers(({ SdeDataProvider }) => {
        expect(SdeDataProvider.fromDirectory(dir).getVersion().version).toBe(
          'unknown',
        );
      });
    });

    it('fromZip and SdeExtractor throw an SdeError naming adm-zip', () => {
      const zipPath = path.join(dir, 'sde.zip');
      fs.writeFileSync(zipPath, '');

      withoutPeers(({ SdeDataProvider, SdeExtractor, SdeErrorClass }) => {
        expect(() => SdeDataProvider.fromZip(zipPath)).toThrow(SdeErrorClass);
        expect(() => SdeDataProvider.fromZip(zipPath)).toThrow(
          'install it with: npm install adm-zip',
        );
        expect(() => new SdeExtractor().listFiles(zipPath)).toThrow(
          'install it with: npm install adm-zip',
        );
      });
    });
  });
});
