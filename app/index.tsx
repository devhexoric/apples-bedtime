import { AlarmClock, BedIcon, MoonStar } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { ReText } from 'react-native-redash';
import { G } from 'react-native-svg';

import CircularSlider from '@/components/CircularSlider';
import CustomSafeArea from '@/components/CustomSafeArea';
import { GradientBackgroud } from '@/components/GradientBackgroud';
import { Colors } from '@/constants/Colors';
import {
    calculateAngleLength,
    calculateTimeFromAngle,
    formatTime,
    parseTimeToRadians,
    roundAngleToFives
} from '@/constants/Utils';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ApplesBedTime = () => {
    const initialValues = useMemo(() => {
        const startTime = '23:00';
        const endTime = '08:00';
        return {
            startAngle: parseTimeToRadians(startTime),
            angleLength: calculateAngleLength(startTime, endTime)
        };
    }, []);

    const startAngle = useSharedValue(initialValues.startAngle);
    const angleLength = useSharedValue(initialValues.angleLength);

    const bedtimeText = useDerivedValue(() => {
        'worklet';
        return formatTime(calculateTimeFromAngle(startAngle.value));
    });

    const wakeTimeText = useDerivedValue(() => {
        'worklet';
        return formatTime(
            calculateTimeFromAngle((startAngle.value + angleLength.value) % (2 * Math.PI))
        );
    });

    const sleepDurationText = useDerivedValue(() => {
        'worklet';
        const totalMinutes = Math.round((angleLength.value / (2 * Math.PI)) * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours === 0) return `${minutes} min`;
        if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
    });

    const handleUpdate = useCallback(({ startAngle: newStart, angleLength: newLength }) => {
        startAngle.value = roundAngleToFives(newStart);
        angleLength.value = roundAngleToFives(newLength);
    }, []);

    return (
        <CustomSafeArea style={styles.container}>
            <GradientBackgroud
                gradientColors={[Colors.primaryDark, Colors.cardBackground, 'rgba(0,0,0,0.85)']}
            />

            <View style={styles.sliderContainer}>
                <View style={styles.timeRow} pointerEvents="none">
                    <TimeBlock label="BEDTIME" icon={<BedIcon color={Colors.primary} size={24} />} text={bedtimeText} />
                    <TimeBlock label="WAKE UP" icon={<MoonStar color={Colors.primary} size={24} />} text={wakeTimeText} />
                </View>

                <CircularSlider
                    startAngle={initialValues.startAngle}
                    angleLength={initialValues.angleLength}
                    onUpdate={handleUpdate}
                    radius={SCREEN_WIDTH * 0.37}
                    strokeWidth={SCREEN_WIDTH * 0.14}
                    segments={24}
                    gradientColorFrom={Colors.primary}
                    gradientColorTo="rgba(49, 72, 185, 0.07)"
                    bgCircleColor={Colors.border}
                    showClockFace
                    clockFaceColor={Colors.secondaryText}
                    startIcon={
                        <G scale="1.2" transform={{ translate: '-12, -12' }}>
                            <MoonStar color={Colors.primaryText} />
                        </G>
                    }
                    stopIcon={
                        <G scale="1.2" transform={{ translate: '-12, -12' }}>
                            <AlarmClock color={Colors.primaryText} />
                        </G>
                    }
                />
                <ReText style={styles.durationText} text={sleepDurationText} />
            </View>
        </CustomSafeArea>
    );
};

const TimeBlock = ({
    label,
    icon,
    text
}: {
    label: string;
    icon: React.ReactNode;
    text: ReturnType<typeof useDerivedValue>;
}) => (
    <View style={styles.timeBlock}>
        <View style={styles.labelRow}>
            {icon}
            <Text style={styles.label}>{label}</Text>
        </View>
        <ReText style={styles.timeValue} text={text} />
    </View>
);

export default ApplesBedTime;

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    sliderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex:1
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 50,
        marginTop: -20,
        marginBottom: 20
    },
    timeBlock: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primaryText,
        marginTop: 4
    },
    timeValue: {
        color: Colors.primaryText,
        fontSize: 20,
        fontWeight: '600'
    },
    durationText: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.primaryText,
        marginTop: 30,
        textAlign: 'center'
    }
});
