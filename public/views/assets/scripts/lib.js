function expandKey(text, secretKey) {
  let expandedKey = "";
  while (expandedKey.length < text.length) {
    expandedKey += secretKey;
  }
  return expandedKey.slice(0, text.length);
}
function multiLevelSubstitute(text, key) {
  let substitutedText = text;

  // Perform substitution twice
  for (let level = 0; level < 2; level++) {
    let tempText = "";
    for (let i = 0; i < substitutedText.length; i++) {
      let charCode = substitutedText.charCodeAt(i);
      let keyCode = key.charCodeAt(i % key.length);
      tempText += String.fromCharCode((charCode + keyCode + level) % 65536);
    }
    substitutedText = tempText;
  }

  return substitutedText;
}
function reverseMultiLevelSubstitute(substitutedText, key) {
  let originalText = substitutedText;

  // Reverse the substitution twice
  for (let level = 1; level >= 0; level--) {
    let tempText = "";
    for (let i = 0; i < originalText.length; i++) {
      let charCode = originalText.charCodeAt(i);
      let keyCode = key.charCodeAt(i % key.length);
      tempText += String.fromCharCode(
        (charCode - keyCode - level + 65536) % 65536
      );
    }
    originalText = tempText;
  }

  return originalText;
}
function advancedTranspose(text, key) {
  let transposedTextArray = Array.from(text);
  let pattern = key
    .split("")
    .map((char) => char.charCodeAt(0) % transposedTextArray.length);

  // Shuffle characters based on the pattern
  for (let i = 0; i < transposedTextArray.length; i++) {
    let swapIndex =
      (i + pattern[i % pattern.length]) % transposedTextArray.length;
    [transposedTextArray[i], transposedTextArray[swapIndex]] = [
      transposedTextArray[swapIndex],
      transposedTextArray[i],
    ];
  }

  return transposedTextArray.join("");
}
function reverseAdvancedTranspose(transposedText, key) {
  let textArray = Array.from(transposedText);
  let pattern = key
    .split("")
    .map((char) => char.charCodeAt(0) % textArray.length);

  // Reverse the shuffling
  for (let i = textArray.length - 1; i >= 0; i--) {
    let swapIndex = (i + pattern[i % pattern.length]) % textArray.length;
    [textArray[i], textArray[swapIndex]] = [textArray[swapIndex], textArray[i]];
  }

  return textArray.join("");
}
function modifyPrimaryKey(primaryKey, key) {
  let modifiedKey = "";
  let username = encodeURIComponent(key);
  for (let i = 0; i < primaryKey.length; i++) {
    let keyChar = primaryKey.charCodeAt(i);
    let userChar = username.charCodeAt(i % username.length); // Loop over username if shorter
    let modifiedChar = String.fromCharCode((keyChar + userChar) % 65536); // Simple addition
    modifiedKey += modifiedChar;
  }
  return modifiedKey;
}
function encrypt(text, username) {
  let primarykey = modifyPrimaryKey("kuPYoVqO4IA=", username);
  let key = expandKey(text, primarykey);
  let substituted = multiLevelSubstitute(text, key);
  return advancedTranspose(substituted, key);
}
function decrypt(encryptedText, username) {
  let primarykey = modifyPrimaryKey("kuPYoVqO4IA=", username);
  let key = expandKey(encryptedText, primarykey);
  let transposed = reverseAdvancedTranspose(encryptedText, key);
  return reverseMultiLevelSubstitute(transposed, key);
}
export { decrypt, encrypt };
