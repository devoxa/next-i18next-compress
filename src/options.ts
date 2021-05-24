export interface Options {
  hashLength?: number
}

export function mergeDefaultOptions(pOptions: Partial<Options> = {}) {
  if (pOptions.hashLength && (pOptions.hashLength < 4 || pOptions.hashLength > 64)) {
    const message =
      `[next-i18next-compress] Misconfiguration detected: ` +
      `The "hashLength" option has to be between 4 and 64`

    throw new Error(message)
  }

  return {
    hashLength: pOptions.hashLength || 6,
  }
}
