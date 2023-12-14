import which from 'which';

export async function hasCommand(name: string) {
  return !!(await which(name, { nothrow: true }));
}

export async function getPythonCommand() {
  if (await hasCommand('python3')) {
    return 'python3';
  } else {
    return 'python';
  }
}
