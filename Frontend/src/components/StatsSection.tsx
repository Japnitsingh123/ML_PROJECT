import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, MapPinned, Gauge } from "lucide-react";

const stats = [
  {
    icon: Brain,
    value: "98.5%",
    label: "Prediction Accuracy",
    color: "text-primary"
  },
  {
    icon: MapPinned,
    value: "250+",
    label: "Routes Covered",
    color: "text-accent"
  },
  {
    icon: Users,
    value: "50K+",
    label: "Daily Users",
    color: "text-success"
  },
  {
    icon: Gauge,
    value: "Real-time",
    label: "Data Processing",
    color: "text-warning"
  }
];

const StatsSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border-2 gradient-card"
            >
              <CardContent className="pt-6 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-background/80 mb-4 ${stat.color}`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
