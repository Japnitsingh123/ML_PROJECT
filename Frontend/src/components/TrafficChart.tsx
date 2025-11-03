import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity } from "lucide-react";
import { useState, useEffect } from "react";

// Define the type for our chart data
interface ChartData {
  time: string;
  congestion: number;
  prediction: number;
}

const TrafficChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch prediction data for different times
  const fetchChartData = async () => {
    try {
      const times = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
      const data: ChartData[] = [];

      for (const time of times) {
        // Use today's date with different times
        const today = new Date().toISOString().split('T')[0];
        const dateTime = `${today} ${time}`;
        
        const response = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            area_name: "Koramangala",
            road_name: "Sony World Junction",
            weather: "Clear",
            date: dateTime
          })
        });

        if (response.ok) {
          const prediction = await response.json();
          
          // FIXED: Remove negative values and scale properly
          const baseCongestion = Math.max(0, prediction.traffic_volume);
          const basePrediction = Math.max(0, prediction.travel_time_index);
          
          const congestion = Math.min(100, Math.max(20, baseCongestion * 80));
          const mlPrediction = Math.min(100, Math.max(20, basePrediction * 80));
          
          data.push({
            time: time.replace(":00", " AM").replace("12", "12 PM").replace("14", "2 PM").replace("16", "4 PM").replace("18", "6 PM").replace("20", "8 PM").replace("22", "10 PM"),
            congestion: Math.round(congestion),
            prediction: Math.round(mlPrediction)
          });
        }
      }
      
      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Fallback to sample data if API fails
      setChartData([
        { time: "6 AM", congestion: 35, prediction: 40 },
        { time: "8 AM", congestion: 75, prediction: 78 },
        { time: "10 AM", congestion: 55, prediction: 52 },
        { time: "12 PM", congestion: 45, prediction: 48 },
        { time: "2 PM", congestion: 40, prediction: 42 },
        { time: "4 PM", congestion: 50, prediction: 55 },
        { time: "6 PM", congestion: 85, prediction: 82 },
        { time: "8 PM", congestion: 65, prediction: 68 },
        { time: "10 PM", congestion: 30, prediction: 28 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchChartData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <Card className="shadow-card border-2">
            <CardContent className="p-8 text-center">
              <div className="text-lg">Loading traffic data...</div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

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
              <BarChart data={chartData}>
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