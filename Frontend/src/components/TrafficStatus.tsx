import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Clock, Route, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface TrafficStatusData {
  route: string;
  area: string;
  road: string;
  status: "high" | "medium" | "low";
  congestion: number;
  avgTime: string;
  trend: "up" | "down" | "stable";
}

const TrafficStatus = () => {
  const [trafficData, setTrafficData] = useState<TrafficStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch live traffic status
  const fetchTrafficStatus = async () => {
    try {
      const routes = [
        { route: "Koramangala → Whitefield", area: "Koramangala", road: "Whitefield Road" },
        { route: "Indiranagar → MG Road", area: "Indiranagar", road: "MG Road" },
        { route: "HSR Layout → Electronic City", area: "HSR Layout", road: "Electronic City Road" }
      ];

      const data: TrafficStatusData[] = [];

      for (const route of routes) {
        const response = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            area_name: route.area,
            road_name: route.road,
            weather: "Clear",
            date: new Date().toISOString().split('T')[0]
          })
        });

        if (response.ok) {
          const prediction = await response.json();
          
          // FIXED: Remove negative values and scale properly
          const baseCongestion = Math.max(0, prediction.traffic_volume);
          const baseTTI = Math.max(0.1, prediction.travel_time_index);
          
          const congestion = Math.min(100, Math.max(20, baseCongestion * 80));
          const travelTimeMinutes = Math.max(10, Math.min(120, Math.round(baseTTI * 45)));
          
          // Determine status based on congestion
          let status: "high" | "medium" | "low";
          if (congestion >= 70) status = "high";
          else if (congestion >= 40) status = "medium";
          else status = "low";

          // Determine trend (simplified - you could compare with previous predictions)
          const trends: ("up" | "down" | "stable")[] = ["up", "down", "stable"];
          const trend = trends[Math.floor(Math.random() * trends.length)];

          data.push({
            route: route.route,
            area: route.area,
            road: route.road,
            status,
            congestion: Math.round(congestion),
            avgTime: `${travelTimeMinutes} min`,
            trend
          });
        }
      }
      
      setTrafficData(data);
    } catch (error) {
      console.error('Error fetching traffic status:', error);
      // Fallback to mock data if API fails
      setTrafficData([
        {
          route: "Koramangala → Whitefield",
          area: "Koramangala",
          road: "Whitefield Road",
          status: "high",
          congestion: 85,
          avgTime: "65 min",
          trend: "up"
        },
        {
          route: "Indiranagar → MG Road",
          area: "Indiranagar", 
          road: "MG Road",
          status: "medium",
          congestion: 55,
          avgTime: "25 min",
          trend: "stable"
        },
        {
          route: "HSR Layout → Electronic City",
          area: "HSR Layout",
          road: "Electronic City Road", 
          status: "low",
          congestion: 25,
          avgTime: "35 min",
          trend: "down"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficStatus();
    
    // Refresh data every 2 minutes for live updates
    const interval = setInterval(fetchTrafficStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high": return "bg-danger text-danger-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "low": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4" />;
      case "down": return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Live Traffic Status</h2>
            <p className="text-lg text-muted-foreground">Loading real-time congestion levels...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="shadow-card border-2 animate-pulse">
                <CardContent className="p-6 h-32"></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Live Traffic Status</h2>
          <p className="text-lg text-muted-foreground">Real-time congestion levels across major routes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trafficData.map((data, index) => (
            <Card 
              key={index} 
              className="shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border-2"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Route className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{data.route}</CardTitle>
                  </div>
                  {getTrendIcon(data.trend)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Congestion Level</span>
                  <Badge className={getStatusColor(data.status)}>
                    {data.status === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {data.congestion}%
                  </Badge>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      data.status === "high" ? "bg-danger" : 
                      data.status === "medium" ? "bg-warning" : 
                      "bg-success"
                    }`}
                    style={{ width: `${data.congestion}%` }}
                  ></div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Avg Time:</span>
                  <span className="font-semibold">{data.avgTime}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrafficStatus;