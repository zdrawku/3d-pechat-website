export const environment = {
  production: true,
  // Get your free access key at https://web3forms.com (it is safe to expose client-side)
  web3formsAccessKey: 'f87d7a52-9790-41c0-992e-f9092aa3645b',
  // Web3Forms' shared free-tier hCaptcha sitekey (safe to expose client-side)
  // Get your own at https://dashboard.hcaptcha.com if you outgrow the free tier
  hcaptchaSiteKey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2',
  // Bookmark Studio gate: SHA-256 of '3dpechat.bg/studio:' + the passphrase (studio-gate.service.ts). Never the passphrase itself.
  studioPassphraseHash: '7598b957b438dc6e85b69b002f9660bb3d519aa80eec8f2479bf651623ab0fd6'
};
