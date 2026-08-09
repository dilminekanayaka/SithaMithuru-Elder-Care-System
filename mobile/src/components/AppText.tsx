import React from 'react';
import { Text as RNText, TextProps, StyleSheet, PixelRatio } from 'react-native';

export interface AppTextProps extends TextProps {
  isHeader?: boolean;
}

export const AppText: React.FC<AppTextProps> = ({ style, isHeader = false, ...props }) => {
  const flatStyle = StyleSheet.flatten(style) || {};
  const baseFontSize = flatStyle.fontSize ?? 16;
  const fontScale = PixelRatio.getFontScale();
  
  // Calculate scaled font size using PixelRatio.getFontScale()
  let scaledSize = baseFontSize * fontScale;
  
  // Enforce a minimum scaled size of 18sp for body/regular text
  if (!isHeader && baseFontSize < 20) {
    if (scaledSize < 18) {
      scaledSize = 18;
    }
  }

  // Handle lineHeight scaling to prevent overlap
  let scaledLineHeight = undefined;
  if (flatStyle.lineHeight) {
    scaledLineHeight = flatStyle.lineHeight * fontScale;
    if (scaledLineHeight < scaledSize * 1.2) {
      scaledLineHeight = Math.round(scaledSize * 1.35);
    }
  } else if (!isHeader) {
    scaledLineHeight = Math.round(scaledSize * 1.4);
  }

  return (
    <RNText
      allowFontScaling={true}
      {...props}
      style={[
        style,
        {
          fontSize: scaledSize,
          ...(scaledLineHeight ? { lineHeight: scaledLineHeight } : {}),
        }
      ]}
    />
  );
};

export default AppText;
