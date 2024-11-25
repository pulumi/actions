import * as core from '@actions/core';
import dedent from 'dedent';
import { Config } from '../config';

function trimOutput(
  message: string,
  maxSize: number,
  alwaysIncludeSummary: boolean,
): [string, boolean] {
  /**
   *  Trim message to maxSize in bytes by for example removing color escape characters
   *  message: ansi string to trim
   *  maxSize: Maximum number of bytes of final message
   *  alwaysIncludeSummary: if true, trim message from front (if trimming is needed), otherwise from end
   *
   *  return message and information if message was trimmed because of size
   */
  let trimmed = false;

  const messageSize = Buffer.byteLength(message, 'utf8');

  // Check if message exceeds max size
  if (messageSize > maxSize) {

    // trim input message by number of exceeded bytes from front or back as configured
    const dif: number = messageSize - maxSize;

    if (alwaysIncludeSummary) {
      message = Buffer.from(message).subarray(dif, messageSize).toString()
    } else {
      message = Buffer.from(message).subarray(0, messageSize - dif).toString()
    }

    trimmed = true;
  }

  return [message, trimmed];
}

export async function handleSummaryMessage(
  config: Config,
  projectName: string,
  output: string,
): Promise<void> {
  const {
    stackName,
    alwaysIncludeSummary,
  } = config;

  // strip ANSI symbols from message because it is not supported in GH step Summary
  const regex_ansi = RegExp(`\x1B(?:[@-Z\\-_]|[[0-?]*[ -/]*[@-~])`, 'g');
  output = output.replace(regex_ansi, '');

  const regex_space = RegExp(`^[ ]`, 'gm');
  output = output.replace(regex_space, '&nbsp;');

  // GitHub limits step Summary to 1 MiB (1_048_576 bytes), use lower max to keep buffer for variable values
  const MAX_SUMMARY_SIZE_BYTES = 1_000_000;

  const [message, trimmed]: [string, boolean] = trimOutput(output, MAX_SUMMARY_SIZE_BYTES, alwaysIncludeSummary);

  let heading = `Pulumi ${projectName}/${stackName} results`;

  if (trimmed && alwaysIncludeSummary) {
    heading += ' :warning: **Warn**: The output was too long and trimmed from the front.';
  } else if (trimmed && !alwaysIncludeSummary) {
    heading += ' :warning: **Warn**: The output was too long and trimmed.';
  }

  const body = dedent`<pre lang="diff"><code>${message}</code></pre>`;

  await core.summary
    .addHeading(heading)
    .addRaw(body)
    .write();
}
