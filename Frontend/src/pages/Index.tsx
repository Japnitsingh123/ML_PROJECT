import HeroSection from "@/components/HeroSection";
import PredictionForm from "@/components/PredictionForm";
import TrafficStatus from "@/components/TrafficStatus";
import StatsSection from "@/components/StatsSection";
import TrafficChart from "@/components/TrafficChart";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <PredictionForm />
      <TrafficStatus />
      <TrafficChart />
      
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 Bangalore Traffic Predictor. Powered by Machine Learning.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
