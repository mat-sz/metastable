const readline = require('readline/promises');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PASSWORD_ENV = 'CODESIGN_PASSWORD';

exports.default = async function (configuration) {
  const tokenPassword = async () => {
    if (!process.env[PASSWORD_ENV]) {
      process.env[PASSWORD_ENV] = await rl.question(
        '\n\n\tPlease enter the password for the hardware token: ',
      );
    }
    return process.env[PASSWORD_ENV];
  };

  require('child_process').execSync(
    `java \
    -jar ../../vendor/jsign-6.0.jar \
    --keystore ./build/hardwareToken.cfg \
    --storepass "${await tokenPassword()}" \
    --storetype PKCS11 \
    --tsaurl http://time.certum.pl/ \
    "${configuration.path}"
    `,
    {
      stdio: 'inherit',
    },
  );
};
