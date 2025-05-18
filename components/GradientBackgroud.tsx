// @ts-nocheck
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

type GradientBackgroundProps = {
    gradientColors?: string[];
};


export function GradientBackgroud({
    gradientColors = ['#7C3AED', '#0a0114', '#0a0114'],
}: GradientBackgroundProps) {

    return (
        <View style={styles.container} pointerEvents="none">
            <LinearGradient
                style={StyleSheet.absoluteFill}
                start={[0.0, -0.3]}
                end={[-0.6, 1.0]}
                colors={gradientColors}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: -1,
    },
});