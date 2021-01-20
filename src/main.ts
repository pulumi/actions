import { makeConfig } from './config';
import * as pulumiCli from './libs/pulumi-cli';
import { invariant } from './libs/utils';

(async () => {
  const config = await makeConfig();

  invariant(pulumiCli.isAvailable(), 'Pulumi CLI is not available.');

  console.log(config);
})();
