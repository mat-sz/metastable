const readline = require('readline/promises');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PASSWORD_ENV = 'CODESIGN_PASSWORD';
const password = process.env[PASSWORD_ENV];

exports.default = async function (configuration) {
  if (!password) {
    return;
  }

  require('child_process').execSync(
    `java \
    -jar ../../vendor/jsign-6.0.jar \
    --keystore ./build/hardwareToken.cfg \
    --storepass "${password}" \
    --storetype PKCS11 \
    --tsaurl http://time.certum.pl/ \
    "${configuration.path}"
    `,
    {
      stdio: 'inherit',
    },
  );
};
