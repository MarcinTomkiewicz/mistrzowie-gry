import { COWORKER_DOCUMENT_MAX_FILE_SIZE } from "../../../src/app/core/configs/coworker-document.config.ts";
import { privatePdfStorage } from "./private-pdf-storage.ts";

export const coworkerPdfStorage = privatePdfStorage(
  "coworker-documents",
  COWORKER_DOCUMENT_MAX_FILE_SIZE,
);
