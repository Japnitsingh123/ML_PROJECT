import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity } from "lucide-react";

const data = [
  { time: "6 AM", congestion: 35, prediction: 40 },
  { time: "8 AM", congestion: 75, prediction: 78 },
  { time: "10 AM", congestion: 55, prediction: 52 },
  { time: "12 PM", congestion: 45, prediction: 48 },
  { time: "2 PM", congestion: 40, prediction: 42 },
  { time: "4 PM", congestion: 50, prediction: 55 },
  { time: "6 PM", congestion: 85, prediction: 82 },
  { time: "8 PM", congestion: 65, prediction: 68 },
  { time: "10 PM", congestion: 30, prediction: 28 }
];

const TrafficChart = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Traffic Patterns Analysis</h2>
          <p className="text-lg text-muted-foreground">Hourly traffic congestion trends and ML predictions</p>
        </div>

        <Card className="shadow-card border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle>Today's Traffic Overview</CardTitle>
            </div>
            <CardDescription>Actual congestion vs ML predictions (Koramangala area)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time" 
                  className="text-sm"
                />
                <YAxis 
                  label={{ value: 'Congestion %', angle: -90, position: 'insideLeft' }}
                  className="text-sm"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="congestion" 
                  fill="hsl(var(--primary))" 
                  name="Actual Traffic"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="prediction" 
                  fill="hsl(var(--accent))" 
                  name="ML Prediction"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TrafficChart;
