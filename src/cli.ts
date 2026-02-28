#!/usr/bin/env bun

import { main } from './cli';

export * from './cli/index';

if (import.meta.main) {
  main();
}
