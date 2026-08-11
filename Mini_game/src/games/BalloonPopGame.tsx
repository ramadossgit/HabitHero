import React, { useState } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import { GameEngine } from "react-native-game-engine";
import Svg from "react-native-svg";
import BalloonComponent from "../components/Balloon";
import { Balloon } from "../types";
import { useRewards } from "../context/RewardsContext";

const { width, height } = Dimensions.get("window");

const randomColor = () =>
  ["red", "blue", "green", "yellow", "purple"][Math.floor(Math.random() * 5)];

const createBalloon = (id: number): Balloon => ({
  id,
  x: Math.random() * (width - 60) + 30,
  y: height,
  radius: 30,
  color: randomColor(),
});

export default function BalloonPopGame() {
  const [balloons, setBalloons] = useState<Balloon[]>([createBalloon(0)]);
  const [balloonId, setBalloonId] = useState(1);

  const { score, addPoints } = useRewards();

  const updateGame = () => {
    setBalloons((prev) =>
      prev.map((b) => ({ ...b, y: b.y - 5 })).filter((b) => b.y > -50)
    );
    if (Math.random() < 0.05) {
      setBalloons((prev) => [...prev, createBalloon(balloonId)]);
      setBalloonId((id) => id + 1);
    }
  };

  const popBalloon = (id: number) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    addPoints(10);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Score: {score}</Text>
      <GameEngine style={styles.engine} systems={[updateGame]} entities={{}} running>
        <Svg height={height} width={width}>
          {balloons.map((b) => (
            <BalloonComponent key={b.id} balloon={b} onPop={popBalloon} />
          ))}
        </Svg>
      </GameEngine>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#87CEEB" },
  engine: { flex: 1 },
  score: {
    position: "absolute",
    top: 50,
    left: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    zIndex: 10,
  },
});
