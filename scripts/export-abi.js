const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  __dirname,
  "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
);

if (!fs.existsSync(artifactPath)) {
  console.error("Compile the contract before exporting the ABI.");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const outDir = path.join(__dirname, "../frontend/src/lib");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "abi.json"), `${JSON.stringify(artifact.abi, null, 2)}\n`);
console.log("Exported ABI to frontend/src/lib/abi.json");
