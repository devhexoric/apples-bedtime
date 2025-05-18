import { Colors } from '@/constants/Colors';
import React, { memo } from 'react';
import { G, Line, Text } from 'react-native-svg';

interface ClockFaceProps {
  r?: number;
  stroke?: string;
}

const ClockFaceComponent: React.FC<ClockFaceProps> = ({ r = 140, stroke = '#9d9d9d' }) => {
  const faceRadius = r - 5;
  const textRadius = r - 26;


  return (
    <G>
      {/* Tick marks for 48 divisions (every 30 minutes) */}
      {Array.from({ length: 48 }, (_, i) => {
        const angle = (2 * Math.PI / 48) * i;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const isHourTick = i % 2 === 0;
        const tickLength = isHourTick ? 10 : 5;

        return (
          <Line
            key={`tick-${i}`}
            stroke={Colors.primary}
            strokeWidth={isHourTick ? 3 : 1}
            x1={cos * faceRadius}
            y1={sin * faceRadius}
            x2={cos * (faceRadius - tickLength)}
            y2={sin * (faceRadius - tickLength)}
          />
        );
      })}

      {/* 24-hour numbers (selective) */}
      <G transform="translate(-2, -1)">
        {Array.from({ length: 24 }, (_, i) => {
          const showText = [0, 6, 12, 18].includes(i);
          const hourLabel =
            i === 0 ? '12 AM' :
            i === 6 ? '6 AM' :
            i === 12 ? '12 PM' :
            i === 18 ? '6 PM' :
            null;

          if (!showText || hourLabel === null) return null;

          const angle = (2 * Math.PI / 24) * i - Math.PI / 2;

          return (
            <Text
              key={`label-${i}`}
              fill={stroke}
              fontSize="10"
              textAnchor="middle"
              x={textRadius * Math.cos(angle)}
              y={textRadius * Math.sin(angle) + 4}
            >
              {hourLabel}
            </Text>
          );
        })}
      </G>
    </G>
  );
};


const ClockFace = memo(ClockFaceComponent);
export default ClockFace;
