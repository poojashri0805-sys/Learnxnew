import {
    Radar
} from "react-chartjs-2";

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export default function RadarChart({ student }) {

    const data = {
        labels: ["Quiz", "Attendance", "Streak", "Tests"],
        datasets: [
            {
                label: "Performance",
                data: [
                    student.quizScore || 50,
                    student.attendance || 70,
                    student.streak || 5,
                    student.avgPercentage || 60
                ],
                backgroundColor: "rgba(139, 92, 246, 0.3)",
                borderColor: "purple"
            }
        ]
    };

    return <Radar data={data} />;
}