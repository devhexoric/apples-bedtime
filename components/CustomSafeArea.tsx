import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import {
    Edge,
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

interface Props {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    edges?: Edge[];
}

const CustomSafeArea: React.FC<Props> = ({ children, style, edges = ['top'] }) => {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView
            edges={edges}
            style={[
                styles.container,
                { paddingTop: insets.top || 16 },
                style,
            ]}
        >
            {children}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default CustomSafeArea;
