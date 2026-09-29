"use client";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import "./FinanceChart.scss";
const data = [
  {
    name: "Group A",
    value: 400,
  },
  {
    name: "Group B",
    value: 300,
  },
  {
    name: "Group C",
    value: 300,
  },
  {
    name: "Group D",
    value: 200,
  },
];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
function FinanceChart() {
  return (
    <div className="finance__chart">
      <PieChart height={400} width={400}>
        <Pie data={data} cx={200} cy={200} dataKey="value">
          {data.map((item, i) => (
            <Cell key={"cell" + item.name} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}
export default FinanceChart;
