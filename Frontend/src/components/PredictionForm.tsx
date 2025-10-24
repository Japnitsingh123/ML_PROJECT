import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Sparkles, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const PredictionForm = () => {
  const [date, setDate] = useState("");
  const [areaName, setAreaName] = useState("");
  const [roadName, setRoadName] = useState("");
  const [weatherConditions, setWeatherConditions] = useState("");
  const [prediction, setPrediction] = useState<{
    trafficVolume: number;
    travelTimeIndex: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!date || !areaName || !roadName || !weatherConditions) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const weatherMap: { [key: string]: string } = {
        "clear": "Clear",
        "cloudy": "Cloudy",
        "rainy": "Rain",
        "foggy": "Fog"
      };

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area_name: areaName,
          road_name: roadName,
          weather: weatherMap[weatherConditions],
          date: date
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prediction");
      }

      const data = await response.json();
      setPrediction({
        trafficVolume: data.traffic_volume,
        travelTimeIndex: data.travel_time_index
      });
      toast.success("Prediction generated!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get prediction. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="prediction-section" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Get Your Traffic Prediction</h2>
          <p className="text-lg text-muted-foreground">Enter road details for ML-powered traffic insights</p>
        </div>

        <Card className="shadow-card border-2 hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Traffic Input Details
            </CardTitle>
            <CardDescription>Enter location and conditions for ML traffic prediction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </Label>
                <Input 
                  id="date" 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border-2 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaName">Area Name</Label>
                <Input 
                  id="areaName" 
                  placeholder="e.g., Koramangala" 
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="border-2 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="roadName">Road Name</Label>
                <Input 
                  id="roadName" 
                  placeholder="e.g., Outer Ring Road" 
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  className="border-2 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weather">Weather Conditions</Label>
                <Select value={weatherConditions} onValueChange={setWeatherConditions}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select weather" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear</SelectItem>
                    <SelectItem value="cloudy">Cloudy</SelectItem>
                    <SelectItem value="rainy">Rainy</SelectItem>
                    <SelectItem value="foggy">Foggy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full text-lg shadow-glow hover:scale-105 transition-transform" 
              size="lg"
              onClick={handlePredict}
              disabled={loading}
            >
              <Sparkles className="mr-2 w-5 h-5" />
              {loading ? "Predicting..." : "Predict Traffic"}
            </Button>
          </CardContent>
        </Card>

        {prediction && (
          <Card className="mt-8 shadow-card border-2 animate-slide-up bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Prediction Results
              </CardTitle>
              <CardDescription>ML-generated traffic predictions for your inputs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-card border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <Label className="text-sm text-muted-foreground">Traffic Volume</Label>
                  </div>
                  <p className="text-4xl font-bold text-primary">{prediction.trafficVolume}</p>
                  <p className="text-sm text-muted-foreground mt-1">vehicles/hour</p>
                </div>
                <div className="p-6 rounded-lg bg-card border-2 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-accent" />
                    <Label className="text-sm text-muted-foreground">Travel Time Index</Label>
                  </div>
                  <p className="text-4xl font-bold text-accent">{prediction.travelTimeIndex}</p>
                  <p className="text-sm text-muted-foreground mt-1">relative to free flow</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default PredictionForm;
