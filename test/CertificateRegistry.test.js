const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CertificateRegistry", function () {
  const certificateId = ethers.id("certichain-sample-id");
  const certificateHash = ethers.id("certichain-sample-hash");
  const otherHash = ethers.id("certichain-other-hash");

  async function deployFixture() {
    const [issuer, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("CertificateRegistry");
    const registry = await factory.deploy();
    await registry.waitForDeployment();
    return { registry, issuer, other };
  }

  it("sets the deployer as the authorized issuer", async function () {
    const { registry, issuer } = await loadFixture(deployFixture);
    expect(await registry.issuer()).to.equal(issuer.address);
  });

  it("lets the authorized issuer issue a certificate", async function () {
    const { registry, issuer } = await loadFixture(deployFixture);
    const tx = await registry.issueCertificate(certificateId, certificateHash);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const stored = await registry.getCertificate(certificateId);

    expect(stored.issuerAddress).to.equal(issuer.address);
    expect(Number(stored.issuedAt)).to.equal(block.timestamp);
    await expect(tx).to.emit(registry, "CertificateIssued");
  });

  it("stores the hash, issuer, timestamp, and active status", async function () {
    const { registry, issuer } = await loadFixture(deployFixture);
    await registry.issueCertificate(certificateId, certificateHash);

    const stored = await registry.getCertificate(certificateId);
    expect(stored.certificateHash).to.equal(certificateHash);
    expect(stored.issuerAddress).to.equal(issuer.address);
    expect(Number(stored.issuedAt)).to.be.greaterThan(0);
    expect(stored.revoked).to.equal(false);
    expect(stored.exists).to.equal(true);
  });

  it("rejects issuance from a non-issuer", async function () {
    const { registry, other } = await loadFixture(deployFixture);
    await expect(registry.connect(other).issueCertificate(certificateId, certificateHash))
      .to.be.revertedWithCustomError(registry, "NotIssuer");
  });

  it("rejects a duplicate certificate ID", async function () {
    const { registry } = await loadFixture(deployFixture);
    await registry.issueCertificate(certificateId, certificateHash);
    await expect(registry.issueCertificate(certificateId, otherHash))
      .to.be.revertedWithCustomError(registry, "CertificateAlreadyExists");
  });

  it("rejects an empty certificate ID", async function () {
    const { registry } = await loadFixture(deployFixture);
    await expect(registry.issueCertificate(ethers.ZeroHash, certificateHash))
      .to.be.revertedWithCustomError(registry, "ZeroCertificateId");
  });

  it("rejects an empty hash", async function () {
    const { registry } = await loadFixture(deployFixture);
    await expect(registry.issueCertificate(certificateId, ethers.ZeroHash))
      .to.be.revertedWithCustomError(registry, "ZeroHash");
  });

  it("returns a successful match for the registered hash", async function () {
    const { registry } = await loadFixture(deployFixture);
    await registry.issueCertificate(certificateId, certificateHash);

    const result = await registry.verifyCertificate(certificateId, certificateHash);
    expect(result.exists).to.equal(true);
    expect(result.hashMatch).to.equal(true);
    expect(result.revoked).to.equal(false);
  });

  it("returns a failed match for a different hash", async function () {
    const { registry } = await loadFixture(deployFixture);
    await registry.issueCertificate(certificateId, certificateHash);

    const result = await registry.verifyCertificate(certificateId, otherHash);
    expect(result.exists).to.equal(true);
    expect(result.hashMatch).to.equal(false);
    expect(result.revoked).to.equal(false);
  });

  it("returns not found for a missing ID without reverting", async function () {
    const { registry } = await loadFixture(deployFixture);
    const missingId = ethers.id("missing-certificate");

    const stored = await registry.getCertificate(missingId);
    expect(stored.exists).to.equal(false);

    const result = await registry.verifyCertificate(missingId, certificateHash);
    expect(result.exists).to.equal(false);
    expect(result.hashMatch).to.equal(false);
    expect(result.revoked).to.equal(false);
  });

  it("lets the authorized issuer revoke a certificate", async function () {
    const { registry, issuer } = await loadFixture(deployFixture);
    await registry.issueCertificate(certificateId, certificateHash);

    await expect(registry.revokeCertificate(certificateId))
      .to.emit(registry, "CertificateRevoked")
      .withArgs(certificateId, issuer.address);

    const stored = await registry.getCertificate(certificateId);
    expect(stored.revoked).to.equal(true);
    expect(stored.certificateHash).to.equal(certificateHash);
  });

  it("does not treat a revoked record as valid even when the hash matches", async function () {
    const { registry } = await loadFixture(deployFixture);
    await registry.issueCertificate(certificateId, certificateHash);
    await registry.revokeCertificate(certificateId);

    const result = await registry.verifyCertificate(certificateId, certificateHash);
    expect(result.exists).to.equal(true);
    expect(result.hashMatch).to.equal(true);
    expect(result.revoked).to.equal(true);
  });

  it("rejects revocation from a non-issuer", async function () {
    const { registry, other } = await loadFixture(deployFixture);
    await registry.issueCertificate(certificateId, certificateHash);
    await expect(registry.connect(other).revokeCertificate(certificateId))
      .to.be.revertedWithCustomError(registry, "NotIssuer");
  });

  it("rejects revocation of a missing certificate", async function () {
    const { registry } = await loadFixture(deployFixture);
    await expect(registry.revokeCertificate(certificateId))
      .to.be.revertedWithCustomError(registry, "CertificateNotFound");
  });

  it("rejects revocation of an already-revoked certificate", async function () {
    const { registry } = await loadFixture(deployFixture);
    await registry.issueCertificate(certificateId, certificateHash);
    await registry.revokeCertificate(certificateId);
    await expect(registry.revokeCertificate(certificateId))
      .to.be.revertedWithCustomError(registry, "CertificateAlreadyRevoked");
  });
});
