"use client";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type Props = {
  scores: number[];
};

export default function ResultadoChart({ scores }: Props) {
  const data = {
    labels: [
      "Abertura",
      "Conscienciosidade",
      "Extroversão",
      "Amabilidade",
      "Neuroticismo",
    ],
    datasets: [
      {
        label: "Seus Resultados",
        data: scores,
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
