// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CertificateRegistry
/// @notice Stores certificate fingerprints for an educational demo.
/// @dev The contract does not store student documents or personal records.
///      There is intentionally no function that changes a hash after issuance.
contract CertificateRegistry {
    struct Certificate {
        bytes32 certificateHash;
        address issuer;
        uint64 issuedAt;
        bool revoked;
        bool exists;
    }

    address private _issuer;
    mapping(bytes32 => Certificate) private certificates;

    event CertificateIssued(
        bytes32 indexed certificateId,
        bytes32 certificateHash,
        address indexed issuer,
        uint64 issuedAt
    );

    event CertificateRevoked(bytes32 indexed certificateId, address indexed issuer);

    error NotIssuer();
    error ZeroCertificateId();
    error ZeroHash();
    error CertificateAlreadyExists();
    error CertificateNotFound();
    error CertificateAlreadyRevoked();

    modifier onlyIssuer() {
        if (msg.sender != _issuer) revert NotIssuer();
        _;
    }

    constructor() {
        _issuer = msg.sender;
    }

    /// @notice Wallet allowed to issue and revoke certificates.
    function issuer() external view returns (address) {
        return _issuer;
    }

    /// @notice Register a new certificate fingerprint. Issuer only.
    function issueCertificate(bytes32 id, bytes32 certificateHash) external onlyIssuer {
        if (id == bytes32(0)) revert ZeroCertificateId();
        if (certificateHash == bytes32(0)) revert ZeroHash();
        if (certificates[id].exists) revert CertificateAlreadyExists();

        uint64 timestamp = uint64(block.timestamp);
        certificates[id] = Certificate({
            certificateHash: certificateHash,
            issuer: msg.sender,
            issuedAt: timestamp,
            revoked: false,
            exists: true
        });

        emit CertificateIssued(id, certificateHash, msg.sender, timestamp);
    }

    /// @notice Mark an existing certificate revoked. Issuer only.
    function revokeCertificate(bytes32 id) external onlyIssuer {
        Certificate storage certificate = certificates[id];
        if (!certificate.exists) revert CertificateNotFound();
        if (certificate.revoked) revert CertificateAlreadyRevoked();

        certificate.revoked = true;
        emit CertificateRevoked(id, msg.sender);
    }

    /// @notice Read the stored record. Missing IDs return exists = false.
    function getCertificate(bytes32 id)
        external
        view
        returns (
            bytes32 certificateHash,
            address issuerAddress,
            uint64 issuedAt,
            bool revoked,
            bool exists
        )
    {
        Certificate storage certificate = certificates[id];
        return (
            certificate.certificateHash,
            certificate.issuer,
            certificate.issuedAt,
            certificate.revoked,
            certificate.exists
        );
    }

    /// @notice Compare a submitted fingerprint with the stored record.
    /// @dev A hash match is not valid when the record is revoked. Callers must check all three flags.
    function verifyCertificate(bytes32 id, bytes32 submittedHash)
        external
        view
        returns (bool exists, bool hashMatch, bool revoked)
    {
        Certificate storage certificate = certificates[id];
        if (!certificate.exists) {
            return (false, false, false);
        }
        return (true, certificate.certificateHash == submittedHash, certificate.revoked);
    }
}
