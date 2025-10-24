import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Clock, Route, AlertTriangle } from "lucide-react";

const mockData = [
  {
    route: "Koramangala → Whitefield",
    status: "high",
    congestion: 85,
    avgTime: "65 min",
    trend: "up"
  },
  {
    route: "Indiranagar → MG Road",
    status: "medium",
    congestion: 55,
    avgTime: "25 min",
    trend: "stable"
  },
  {
    route: "HSR Layout → Electronic City",
    status: "low",
    congestion: 25,
    avgTime: "35 min",
    trend: "down"
  }
];

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

const TrafficStatus = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Live Traffic Status</h2>
          <p className="text-lg text-muted-foreground">Real-time congestion levels across major routes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockData.map((data, index) => (
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
