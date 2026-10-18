const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const { hashCertificate, generateCertificateId } = await import(
    "../frontend/src/lib/certificateHash.js"
  );
  const { sampleCertificate } = await import("../frontend/src/lib/sampleData.js");

  const deploymentPath = path.join(__dirname, "../frontend/src/lib/deployment.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  if (!deployment.address) {
    throw new Error("Deploy the contract before issuing the sample certificate.");
  }

  const id = generateCertificateId();
  const certificateHash = await hashCertificate(sampleCertificate);
  const registry = await hre.ethers.getContractAt("CertificateRegistry", deployment.address);
  const tx = await registry.issueCertificate(id, certificateHash);
  const receipt = await tx.wait();

  console.log("Sample certificate issued");
  console.log("Student:", sampleCertificate.studentName);
  console.log("Course:", sampleCertificate.course);
  console.log("Institution:", sampleCertificate.institution);
  console.log("Year:", sampleCertificate.graduationYear);
  console.log("ID:", id);
  console.log("Hash:", certificateHash);
  console.log("Tx:", receipt.hash);
  console.log(`Verify: http://localhost:5173/verify?id=${id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
