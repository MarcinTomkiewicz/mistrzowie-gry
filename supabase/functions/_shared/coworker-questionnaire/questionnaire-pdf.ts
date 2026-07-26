import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import { PDFDocument } from "npm:pdf-lib@1.17.1";

import type { QuestionnairePayload, SaveEnvelopeResult } from "./contracts.ts";
import { buildQuestionnairePdfContent } from "./questionnaire-pdf-content.ts";
import { QUESTIONNAIRE_PDF_COPY as COPY } from "./questionnaire-pdf-copy.ts";
import { QuestionnairePdfRenderer } from "./questionnaire-pdf-renderer.ts";

const REGULAR_FONT_URL = new URL(
  "../../coworker-questionnaire/assets/Lato-Regular.ttf",
  import.meta.url,
);
const BOLD_FONT_URL = new URL(
  "../../coworker-questionnaire/assets/Lato-Bold.ttf",
  import.meta.url,
);

export async function generateQuestionnairePdf(
  payload: QuestionnairePayload,
  saveResult: SaveEnvelopeResult,
): Promise<Uint8Array> {
  const declaration = saveResult.currentDeclaration;
  if (declaration === null) {
    throw new Error("Completed questionnaire declaration is missing.");
  }

  const [regularBytes, boldBytes] = await Promise.all([
    Deno.readFile(REGULAR_FONT_URL),
    Deno.readFile(BOLD_FONT_URL),
  ]);
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const [regularFont, boldFont] = await Promise.all([
    document.embedFont(regularBytes, { subset: true }),
    document.embedFont(boldBytes, { subset: true }),
  ]);

  document.setTitle(COPY.title);
  const declarationDate = new Date(declaration.acceptedAt);
  document.setCreationDate(declarationDate);
  document.setModificationDate(declarationDate);

  const renderer = new QuestionnairePdfRenderer(
    document,
    regularFont,
    boldFont,
  );
  renderer.drawTitle(COPY.title);
  renderer.drawContent(
    buildQuestionnairePdfContent(payload, declaration.statementText),
  );

  return await document.save({
    addDefaultPage: false,
    useObjectStreams: false,
  });
}
