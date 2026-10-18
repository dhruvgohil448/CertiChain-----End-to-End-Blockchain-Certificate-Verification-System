const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await factory.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const outDir = path.join(__dirname, "../frontend/src/lib");
  fs.mkdirSync(outDir, { recursive: true });
  const deployment = { address, chainId };
  fs.writeFileSync(path.join(outDir, "deployment.json"), `${JSON.stringify(deployment, null, 2)}\n`);

  console.log("CertificateRegistry deployed to:", address);
  console.log("Chain ID:", chainId);
  console.log("Issuer:", await registry.issuer());
  console.log("Wrote frontend/src/lib/deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
