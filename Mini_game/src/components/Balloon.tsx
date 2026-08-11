import React from "react";
import { TouchableWithoutFeedback } from "react-native";
import { Circle } from "react-native-svg";
import { Balloon } from "../types";

type Props = {
  balloon: Balloon;
  onPop: (id: number) => void;
};

export default function BalloonComponent({ balloon, onPop }: Props) {
  return (
    <TouchableWithoutFeedback onPress={() => onPop(balloon.id)}>
      <Circle cx={balloon.x} cy={balloon.y} r={balloon.radius} fill={balloon.color} />
    </TouchableWithoutFeedback>
  );
}
