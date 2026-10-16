import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

let testEnvironment: RulesTestEnvironment | undefined;

export async function getFirebaseTestEnvironment() {
  if (testEnvironment) {
    return testEnvironment;
  }

  const projectId = process.env.GCLOUD_PROJECT ?? "demo-revoo-crm";
  const rules = await readFile(resolve(process.cwd(), "firestore.rules"), "utf8");
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });

  return testEnvironment;
}

export async function cleanupFirebaseTestEnvironment() {
  await testEnvironment?.cleanup();
  testEnvironment = undefined;
}
