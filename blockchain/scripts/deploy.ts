import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const verifierAddress = process.env.AI_VERIFIER_ADDRESS;
  if (!verifierAddress) {
    throw new Error("AI_VERIFIER_ADDRESS is not set in environment");
  }

  const DonationVerifier = await ethers.getContractFactory("DonationVerifier");
  const donationVerifier = await DonationVerifier.deploy(verifierAddress);

  await donationVerifier.waitForDeployment();
  const address = await donationVerifier.getAddress();

  console.log("DonationVerifier deployed to:", address);
  console.log("AI verifier address:", verifierAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

