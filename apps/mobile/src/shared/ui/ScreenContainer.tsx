import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/tokens";

/**
 * 모든 화면(대기/라운지/비상/제단/사망)의 공통 배경·패딩 래퍼.
 *
 * 키보드 처리도 여기서 일괄로 한다 — RN은 입력 바깥을 눌러도 키보드가
 * 저절로 내려가지 않아서, 화면 아무 곳이나 누르면 닫히도록 감싼다.
 * 입력이 키보드에 가리지 않도록 iOS에서는 padding으로 밀어 올린다.
 */
export function ScreenContainer({ style, children, ...rest }: ViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <View style={[styles.container, style]} {...rest}>
            {children}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  container: { flex: 1, padding: spacing.lg },
});
