# COWORKER-DOC-EDGE-1 - coworker-documents

## Files

Copy the complete directory:

```text
supabase/functions/coworker-documents/
  contracts.ts
  errors.ts
  index.ts
```

## `supabase/config.toml`

Add this section directly after the existing
`[functions.coworker-questionnaire]` section:

```toml
[functions.coworker-documents]
verify_jwt = true
```

The final fragment should be:

```toml
[functions.coworker-questionnaire]
verify_jwt = true

[functions.coworker-documents]
verify_jwt = true
```

## Deploy

Run from the repository root:

```powershell
npx --yes supabase@latest functions deploy coworker-documents `
  --project-ref "ctqyhrwioodtqzptzsgd" `
  --use-api
```

## Deployment verification

```powershell
npx --yes supabase@latest functions list `
  --project-ref "ctqyhrwioodtqzptzsgd"
```

The list must contain `coworker-documents`.

## Unauthenticated smoke

```powershell
curl.exe -i `
  "https://ctqyhrwioodtqzptzsgd.supabase.co/functions/v1/coworker-documents"
```

Expected result: HTTP `401`.

## Authorized portal smoke

Set a current coworker access token locally. Do not paste it into chat.

```powershell
$accessToken = "<AUTHENTICATED_COWORKER_ACCESS_TOKEN>"

curl.exe -i `
  -H "Authorization: Bearer $accessToken" `
  "https://ctqyhrwioodtqzptzsgd.supabase.co/functions/v1/coworker-documents"
```

Expected result: HTTP `200` and portal JSON for the authenticated coworker.

## POST actions

All POST requests use `Content-Type: application/json`.

### Reserve upload

```json
{
  "action": "reserveUpload",
  "documentId": null,
  "requirementId": "<UUID_OR_NULL>",
  "documentDefinitionId": "<UUID_OR_NULL>",
  "onboardingCaseId": "<UUID_OR_NULL>",
  "originalFilename": "document.pdf",
  "declaredMimeType": "application/pdf",
  "sizeBytes": 123456,
  "signatureDeclarationType": "handwritten",
  "title": null
}
```

The response returns `signedUpload.path`, `signedUpload.token` and
`signedUpload.signedUrl`. A browser client using `supabase-js` should upload
with `uploadToSignedUrl(path, token, file, { contentType })`.

### Finalize upload

```json
{
  "action": "finalizeUpload",
  "uploadSessionId": "<UUID>"
}
```

### Cancel upload

```json
{
  "action": "cancelUpload",
  "uploadSessionId": "<UUID>"
}
```

### Submit document

```json
{
  "action": "submitDocument",
  "documentId": "<UUID>",
  "documentVersionId": "<UUID>"
}
```

### Withdraw document

```json
{
  "action": "withdrawDocument",
  "documentId": "<UUID>"
}
```

### Create download URL

```json
{
  "action": "downloadDocumentVersion",
  "documentVersionId": "<UUID>"
}
```

### Mark notification as read

```json
{
  "action": "markNotificationRead",
  "notificationId": "<UUID>"
}
```
