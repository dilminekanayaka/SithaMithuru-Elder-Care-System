import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

export interface AccessibleButtonProps extends TouchableOpacityProps {}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  style,
  hitSlop,
  activeOpacity = 0.7,
  ...props
}) => {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      hitSlop={hitSlop || { top: 12, bottom: 12, left: 12, right: 12 }}
      style={[
        {
          minWidth: 48,
          minHeight: 48,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

export default AccessibleButton;
