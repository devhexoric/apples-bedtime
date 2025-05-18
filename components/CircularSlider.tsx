// @ts-nocheck
import { Colors } from '@/constants/Colors';
import range from 'lodash.range';
import React, {
  FC,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import {
  InteractionManager,
  LayoutChangeEvent,
  PanResponder,
  PanResponderInstance,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { interpolateColor } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import ClockFace from './ClockFace';


type CircularSliderProps = {
  onUpdate: (angles: { startAngle: number; angleLength: number }) => void;
  startAngle: number;
  angleLength: number;
  segments?: number;
  strokeWidth?: number;
  radius?: number;
  gradientColorFrom?: string;
  gradientColorTo?: string;
  clockFaceColor?: string;
  bgCircleColor?: string;
  showClockFace?: boolean;
  startIcon?: ReactNode;
  stopIcon?: ReactNode;
  tapToUpdate?: boolean; // New prop to enable/disable tap updates
};

const MIN_ANGLE_LENGTH = Math.PI / 18;

const calculateArcColor = (
  index: number,
  segments: number,
  from: string,
  to: string
) => {
  const progress = index / segments;
  return {
    fromColor: interpolateColor(progress, [0, 1], [from, to]),
    toColor: interpolateColor((index + 1) / segments, [0, 1], [from, to]),
  };
};

const calculateArcCircle = (
  index: number,
  segments: number,
  radius: number,
  startAngle: number,
  angleLength: number
) => {
  const fromAngle = (angleLength / segments) * index + startAngle;
  const toAngle = (angleLength / segments) * (index + 1) + startAngle;
  return {
    fromX: radius * Math.sin(fromAngle),
    fromY: -radius * Math.cos(fromAngle),
    toX: radius * Math.sin(toAngle),
    toY: -radius * Math.cos(toAngle),
  };
};

const getGradientId = (index: number) => `gradient${index}`;

const CircularSlider: FC<CircularSliderProps> = ({
  onUpdate,
  startAngle: initialStartAngle,
  angleLength: initialAngleLength,
  segments = 5,
  strokeWidth = 40,
  radius = 145,
  gradientColorFrom = '#3B38A8',
  gradientColorTo = '#3148B9',
  clockFaceColor = '#9d9d9d',
  bgCircleColor = '#171717',
  showClockFace = true,
  startIcon,
  stopIcon,
  tapToUpdate = true, // Default to true for backward compatibility
}) => {
 
  const startAngleRef = useRef(initialStartAngle);
  const angleLengthRef = useRef(initialAngleLength);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const circleRef = useRef<View>(null);
  const circleCenterRef = useRef({ x: 0, y: 0 });
  const activeHandleRef = useRef(null); // Track which handle is active

  // Update refs if props change externally
  useEffect(() => {
    startAngleRef.current = initialStartAngle;
    angleLengthRef.current = initialAngleLength;
    forceUpdate();
  }, [initialStartAngle, initialAngleLength]);

  const getContainerWidth = () => strokeWidth + radius * 2 + 2;

  // Improved center position calculation - called once on mount and layout
  const updateCircleCenterPosition = useCallback(() => {
    if (!circleRef.current) return;
    
    InteractionManager.runAfterInteractions(() => {
      circleRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const half = getContainerWidth() / 2;
        circleCenterRef.current = { 
          x: pageX + half, 
          y: pageY + half 
        };
      });
    });
  }, []);

  // Simplified and optimized angle calculation
  const calculateAngle = useCallback((moveX: number, moveY: number) => {
    const { x, y } = circleCenterRef.current;
    const dx = moveX - x;
    const dy = moveY - y;
    
    // Calculate angle with atan2
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    
    // Normalize angle to 0-2π
    if (angle < 0) angle += 2 * Math.PI;
    
    return angle;
  }, []);

  // Handle tap on the circle to update the end position (wake time)
  const handleTap = useCallback((e) => {
    if (!tapToUpdate) return;
    
    // Extract the touch coordinates
    const { locationX, locationY, pageX, pageY } = e.nativeEvent;
    
    // Calculate the angle based on the tap position
    const newAngle = calculateAngle(pageX, pageY);
    
    // Check if the tap is near the start handle - if so, don't update
    const startPosition = {
      x: circleCenterRef.current.x + radius * Math.sin(startAngleRef.current),
      y: circleCenterRef.current.y - radius * Math.cos(startAngleRef.current)
    };
    
    const distToStart = Math.sqrt(
      Math.pow(pageX - startPosition.x, 2) + 
      Math.pow(pageY - startPosition.y, 2)
    );
    
    // If tap is near the start handle (within handle radius + buffer), ignore
    if (distToStart < strokeWidth) {
      return;
    }
    
    // Calculate new angle length
    const newLength = (newAngle - startAngleRef.current + 2 * Math.PI) % (2 * Math.PI);
    
    // Only update if the resulting angle length is within constraints
    if (newLength >= MIN_ANGLE_LENGTH && newLength <= 2 * Math.PI - MIN_ANGLE_LENGTH) {
      
      // Update angle length
      angleLengthRef.current = newLength;
      
      // Update parent with new values
      onUpdate({ 
        startAngle: startAngleRef.current, 
        angleLength: angleLengthRef.current 
      });
      
      forceUpdate();
    }
  }, [calculateAngle, onUpdate, radius, startAngleRef, tapToUpdate, strokeWidth]);

  const handlePanResponderMove = useCallback(
    (moveX: number, moveY: number, isStartHandle: boolean) => {
      // Calculate new angle based on touch position
      const newAngle = calculateAngle(moveX, moveY);
      
      if (isStartHandle) {
        // Handling the start handle (bedtime)
        const currentAngleLength = angleLengthRef.current;
        
        // Calculate how this would affect the angle length if we move the start
        const potentialLength = (2 * Math.PI + angleLengthRef.current - 
          (newAngle - startAngleRef.current)) % (2 * Math.PI);
          
        // Only update if the resulting angle length is within constraints
        if (potentialLength >= MIN_ANGLE_LENGTH && potentialLength <= 2 * Math.PI - MIN_ANGLE_LENGTH) {
          const prevStart = startAngleRef.current;
          startAngleRef.current = newAngle;
          angleLengthRef.current = (currentAngleLength + prevStart - newAngle + 2 * Math.PI) % (2 * Math.PI);
          
          // Update parent with new values
          onUpdate({ 
            startAngle: startAngleRef.current, 
            angleLength: angleLengthRef.current 
          });
          
          forceUpdate();
        }
      } else {
        // Handling the end handle (wake time)
        const newLength = (newAngle - startAngleRef.current + 2 * Math.PI) % (2 * Math.PI);
        
        // Only update if the resulting angle length is within constraints
        if (newLength >= MIN_ANGLE_LENGTH && newLength <= 2 * Math.PI - MIN_ANGLE_LENGTH) {
          angleLengthRef.current = newLength;
          
          // Update parent with new values
          onUpdate({ 
            startAngle: startAngleRef.current, 
            angleLength: angleLengthRef.current 
          });
          
          forceUpdate();
        }
      }
    },
    [calculateAngle, onUpdate]
  );

  // Create optimized pan responders for both handles
  const createPanResponder = useCallback((isStartHandle: boolean): PanResponderInstance => {
    return PanResponder.create({
      // Improve responsiveness by always claiming the gesture
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      
      // Grant the gesture and notify parent
      onPanResponderGrant: () => {
        activeHandleRef.current = isStartHandle ? 'start' : 'end';
      },
      
      // Handle movement with minimal processing
      onPanResponderMove: (_, gesture) => {
        handlePanResponderMove(gesture.moveX, gesture.moveY, isStartHandle);
      },
      
      // Cleanup on release
      onPanResponderRelease: () => {
        activeHandleRef.current = null;
      },
      
      // Ensure cleanup on termination as well
      onPanResponderTerminate: () => {
        activeHandleRef.current = null;
      },
    });
  }, [handlePanResponderMove]);

  // Memoize pan responders to prevent recreation
  const startHandlePanResponder = useRef(createPanResponder(true)).current;
  const endHandlePanResponder = useRef(createPanResponder(false)).current;

  const containerWidth = getContainerWidth();
  
  // Calculate handle positions
  const start = calculateArcCircle(
    0,
    segments,
    radius,
    startAngleRef.current,
    angleLengthRef.current
  );
  
  const stop = calculateArcCircle(
    segments - 1,
    segments,
    radius,
    startAngleRef.current,
    angleLengthRef.current
  );

  // Handle layout once and update center position
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    updateCircleCenterPosition();
  }, [updateCircleCenterPosition]);

  // Update position on mount
  useEffect(() => {
    const timerId = setTimeout(updateCircleCenterPosition, 100);
    return () => clearTimeout(timerId);
  }, [updateCircleCenterPosition]);

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={{ width: containerWidth, height: containerWidth }} onLayout={onLayout}>
        <Svg height={containerWidth} width={containerWidth} ref={circleRef}>
          <Defs>
            {range(segments).map((i) => {
              const { fromX, fromY, toX, toY } = calculateArcCircle(
                i,
                segments,
                radius,
                startAngleRef.current,
                angleLengthRef.current
              );
              const { fromColor, toColor } = calculateArcColor(
                i,
                segments,
                gradientColorFrom,
                gradientColorTo
              );
              return (
                <LinearGradient
                  key={i}
                  id={getGradientId(i)}
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                >
                  <Stop offset="0%" stopColor={fromColor} />
                  <Stop offset="100%" stopColor={toColor} />
                </LinearGradient>
              );
            })}
          </Defs>

          <G transform={{ translate: `${strokeWidth / 2 + radius + 1}, ${strokeWidth / 2 + radius + 1}` }}>
            <Circle 
              r={radius} 
              strokeWidth={strokeWidth} 
              fill="transparent" 
              stroke={bgCircleColor} 
            />
            
            {showClockFace && (
              <ClockFace 
                r={radius - strokeWidth / 2} 
                stroke={clockFaceColor} 
              />
            )}

            {range(segments).map((i) => {
              const { fromX, fromY, toX, toY } = calculateArcCircle(
                i,
                segments,
                radius,
                startAngleRef.current,
                angleLengthRef.current
              );
              return (
                <Path
                  key={i}
                  d={`M ${fromX} ${fromY} A ${radius} ${radius} 0 0 1 ${toX} ${toY}`}
                  strokeWidth={strokeWidth}
                  stroke={`url(#${getGradientId(i)})`}
                  fill="transparent"
                />
              );
            })}

            {/* End handle (wake time) */}
            <G
              fill={gradientColorTo}
              transform={{ translate: `${stop.toX}, ${stop.toY}` }}
              {...endHandlePanResponder.panHandlers}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Circle
                r={(strokeWidth - 1) / 2}
                fill={Colors.cardBackground}
                stroke={gradientColorTo}
                strokeWidth="1"
              />
              {stopIcon}
            </G>

            {/* Start handle (bedtime) */}
            <G
              fill={gradientColorFrom}
              transform={{ translate: `${start.fromX}, ${start.fromY}` }}
              {...startHandlePanResponder.panHandlers}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Circle
                r={(strokeWidth - 1) / 2}
                fill={Colors.cardBackground}
                stroke={gradientColorFrom}
                strokeWidth="1"
              />
              {startIcon}
            </G>
          </G>
        </Svg>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default memo(CircularSlider);